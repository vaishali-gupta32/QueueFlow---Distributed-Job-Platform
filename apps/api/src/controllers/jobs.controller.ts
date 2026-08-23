import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { addJobToQueue } from '../utils/queue';
import { logger } from '../utils/logger';
import {
  CreateJobSchema,
  JobQuerySchema,
  JobType,
  JobStatus,
  Role,
  EmailPayloadSchema,
  WebhookPayloadSchema,
  ReportPayloadSchema,
} from '@queueflow/shared';

export async function createJob(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const body = CreateJobSchema.parse(req.body);
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;

    // Validate type specific payload
    if (body.type === JobType.EMAIL) {
      EmailPayloadSchema.parse(body.payload);
    } else if (body.type === JobType.WEBHOOK) {
      WebhookPayloadSchema.parse(body.payload);
    } else if (body.type === JobType.REPORT) {
      ReportPayloadSchema.parse(body.payload);
    }

    // Check for existing idempotency key in DB if header provided
    if (idempotencyKey) {
      const existingJob = await prisma.job.findUnique({
        where: { idempotencyKey },
      });
      if (existingJob) {
        logger.info({ event: 'idempotency_job_match', idempotencyKey, jobId: existingJob.id }, 'Returning existing job for idempotency key');
        return res.status(202).json({
          success: true,
          data: existingJob,
        });
      }
    }

    // 1. Create Job record in PostgreSQL
    const job = await prisma.job.create({
      data: {
        userId,
        type: body.type as JobType,
        status: JobStatus.PENDING,
        payload: body.payload,
        maxAttempts: body.maxAttempts || 3,
        priority: body.priority || 1,
        idempotencyKey,
      },
    });

    // 2. Queue Job into BullMQ
    await addJobToQueue(job.id, job.type, job.priority);

    logger.info({ event: 'job_created', jobId: job.id, userId, type: job.type }, 'Job created and enqueued');

    // 3. Return 202 Accepted immediately
    return res.status(202).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
}

export async function getJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const query = JobQuerySchema.parse(req.query);
    const user = req.user!;

    const where: any = {};

    // RBAC: Users only see their own jobs; Admins can see all jobs
    if (user.role !== Role.ADMIN) {
      where.userId = user.id;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: jobs,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getJobById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user!;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        attemptLogs: {
          orderBy: { attemptNumber: 'asc' },
        },
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' },
      });
    }

    // RBAC Check: Ensure user owns the job or is Admin
    if (user.role !== Role.ADMIN && job.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access to this job is denied' },
      });
    }

    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user!;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' },
      });
    }

    if (user.role !== Role.ADMIN && job.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    if (![JobStatus.PENDING, JobStatus.RETRYING].includes(job.status as JobStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL',
          message: `Job in state ${job.status} cannot be cancelled`,
        },
      });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: { status: JobStatus.CANCELLED },
    });

    logger.info({ event: 'job_cancelled', jobId: id, cancelledBy: user.id }, 'Job cancelled by user');

    return res.status(200).json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    next(error);
  }
}

export async function retryJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user!;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' },
      });
    }

    // Standard users can retry their own failed/cancelled jobs; Admins can retry any DLQ or failed job
    if (user.role !== Role.ADMIN && job.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    // Reset attempts and set state back to PENDING
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.PENDING,
        attempts: 0,
        failedAt: null,
        lastError: null,
        nextRetryAt: null,
      },
    });

    // Re-queue to BullMQ
    await addJobToQueue(updatedJob.id, updatedJob.type, updatedJob.priority);

    logger.info({ event: 'job_manual_retry', jobId: id, retriedBy: user.id }, 'Job manually retried and re-queued');

    return res.status(200).json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    next(error);
  }
}
