import { Worker, Job as BullJob, Queue } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from './utils/prisma';
import { getJobHandler } from './handlers';
import { config } from './config/env';
import { logger } from './utils/logger';
import { JobStatus } from '@queueflow/shared';
import { incrementWorkerStats } from './heartbeat';

const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

export const retryQueue = new Queue('job-processing', { connection });

export function calculateExponentialBackoff(attemptNumber: number, baseDelayMs: number = 2000): number {
  return baseDelayMs * Math.pow(2, Math.max(0, attemptNumber - 1));
}

export function startWorkerProcessor() {
  const worker = new Worker(
    'job-processing',
    async (bullJob: BullJob) => {
      const { jobId, type } = bullJob.data;
      const startTime = Date.now();

      logger.info({ event: 'job_started', jobId, type, workerId: config.workerId }, 'Worker picked up job');

      // 1. Fetch canonical job data from PostgreSQL
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        logger.warn({ event: 'job_missing', jobId }, 'Job record not found in PostgreSQL');
        return;
      }

      if (job.status === JobStatus.CANCELLED) {
        logger.info({ event: 'job_skipped_cancelled', jobId }, 'Job was cancelled before execution');
        return;
      }

      const currentAttempt = job.attempts + 1;

      // 2. Update status to PROCESSING
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.PROCESSING,
          startedAt: job.startedAt || new Date(),
          attempts: currentAttempt,
        },
      });

      // 3. Log attempt entry in DB
      const attemptRecord = await prisma.jobAttempt.create({
        data: {
          jobId,
          attemptNumber: currentAttempt,
          status: JobStatus.PROCESSING,
          startedAt: new Date(),
        },
      });

      // 4. Execute strategy handler
      let handlerResult;
      let errorOccurred: string | null = null;

      try {
        const handler = getJobHandler(type);
        handlerResult = await handler.execute(job.payload);
        if (!handlerResult.success) {
          errorOccurred = handlerResult.error || 'Job handler execution failed';
        }
      } catch (err: any) {
        errorOccurred = err.message || 'Unexpected exception during job execution';
      }

      const durationMs = Date.now() - startTime;

      // 5. Handle Execution Outcome
      if (!errorOccurred) {
        // SUCCESS
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: JobStatus.COMPLETED,
            completedAt: new Date(),
            lastError: null,
          },
        });

        await prisma.jobAttempt.update({
          where: { id: attemptRecord.id },
          data: {
            status: JobStatus.COMPLETED,
            completedAt: new Date(),
            durationMs,
          },
        });

        incrementWorkerStats('SUCCESS');
        logger.info({ event: 'job_completed', jobId, durationMs, workerId: config.workerId }, 'Job completed successfully');
      } else {
        // FAILURE
        const maxAttempts = job.maxAttempts || config.maxJobAttempts;

        if (currentAttempt >= maxAttempts) {
          // TRANSITION TO DEAD LETTER QUEUE
          await prisma.job.update({
            where: { id: jobId },
            data: {
              status: JobStatus.DEAD_LETTER,
              failedAt: new Date(),
              lastError: errorOccurred,
            },
          });

          await prisma.jobAttempt.update({
            where: { id: attemptRecord.id },
            data: {
              status: JobStatus.DEAD_LETTER,
              completedAt: new Date(),
              durationMs,
              error: errorOccurred,
            },
          });

          incrementWorkerStats('FAILED');
          logger.error(
            { event: 'job_dead_letter', jobId, attempts: currentAttempt, maxAttempts, error: errorOccurred },
            'Job failed maximum attempts. Transitioned to DEAD_LETTER status'
          );
        } else {
          // EXPONENTIAL BACKOFF RETRY SCHEDULING
          const delayMs = calculateExponentialBackoff(currentAttempt);
          const nextRetryAt = new Date(Date.now() + delayMs);

          await prisma.job.update({
            where: { id: jobId },
            data: {
              status: JobStatus.RETRYING,
              lastError: errorOccurred,
              nextRetryAt,
            },
          });

          await prisma.jobAttempt.update({
            where: { id: attemptRecord.id },
            data: {
              status: JobStatus.FAILED,
              completedAt: new Date(),
              durationMs,
              error: errorOccurred,
            },
          });

          // Schedule delayed retry in BullMQ
          await retryQueue.add(
            type,
            { jobId, type },
            { delay: delayMs, priority: job.priority }
          );

          incrementWorkerStats('FAILED');
          logger.warn(
            { event: 'job_retry_scheduled', jobId, attempt: currentAttempt, nextRetryAt, delayMs, error: errorOccurred },
            `Job attempt ${currentAttempt} failed. Scheduled retry #${currentAttempt + 1} in ${delayMs}ms`
          );
        }
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ event: 'bullmq_worker_error', jobId: job?.id, error: err.message }, 'BullMQ worker error');
  });

  logger.info({ event: 'worker_started', workerId: config.workerId }, 'BullMQ Worker process initialized');
  return worker;
}
