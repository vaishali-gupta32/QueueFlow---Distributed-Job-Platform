import { Queue } from 'bullmq';
import { config } from '../config/env';
import { logger } from './logger';
import Redis from 'ioredis';

const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

export const jobQueue = new Queue('job-processing', {
  connection,
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
  },
});

export async function addJobToQueue(jobId: string, type: string, priority: number = 1) {
  try {
    const bullJob = await jobQueue.add(
      type,
      { jobId, type },
      {
        jobId, // Unique BullMQ ID matches DB Job ID
        priority,
      }
    );
    logger.info({ event: 'job_queued', jobId, type, bullJobId: bullJob.id }, 'Job successfully queued to Redis');
    return bullJob;
  } catch (error: any) {
    logger.error({ event: 'job_queue_error', jobId, error: error.message }, 'Failed to enqueue job');
    throw error;
  }
}
