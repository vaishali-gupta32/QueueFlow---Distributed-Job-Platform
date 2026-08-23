import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { JobStatus, WorkerStatus } from '@queueflow/shared';
import { config } from '../config/env';
import { addJobToQueue } from '../utils/queue';
import { logger } from '../utils/logger';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { jobs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

export async function listWorkers(req: Request, res: Response, next: NextFunction) {
  try {
    const workers = await prisma.worker.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const now = new Date().getTime();
    const timeoutMs = parseInt(process.env.WORKER_HEARTBEAT_TIMEOUT || '30000', 10);

    // Compute dynamic health status based on heartbeat threshold
    const evaluatedWorkers = workers.map((worker) => {
      const lastHeartbeatMs = new Date(worker.lastHeartbeat).getTime();
      const diffMs = now - lastHeartbeatMs;

      let status: WorkerStatus = worker.status as WorkerStatus;
      if (diffMs > timeoutMs * 2) {
        status = WorkerStatus.OFFLINE;
      } else if (diffMs > timeoutMs) {
        status = WorkerStatus.UNHEALTHY;
      }

      return {
        ...worker,
        status,
        lastHeartbeatAgoSeconds: Math.floor(diffMs / 1000),
      };
    });

    return res.status(200).json({
      success: true,
      data: evaluatedWorkers,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDeadLetterJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const skip = (page - 1) * limit;

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where: { status: JobStatus.DEAD_LETTER } }),
      prisma.job.findMany({
        where: { status: JobStatus.DEAD_LETTER },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          attemptLogs: { orderBy: { attemptNumber: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: jobs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function retryDeadLetterJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' },
      });
    }

    // Reset job state and requeue
    const retriedJob = await prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.PENDING,
        attempts: 0,
        failedAt: null,
        lastError: null,
        nextRetryAt: null,
      },
    });

    await addJobToQueue(retriedJob.id, retriedJob.type, retriedJob.priority);

    logger.info({ event: 'admin_dlq_retry', jobId: id, adminId: req.user!.id }, 'Admin retried DLQ job');

    return res.status(200).json({
      success: true,
      data: retriedJob,
    });
  } catch (error) {
    next(error);
  }
}
