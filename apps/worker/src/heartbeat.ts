import { prisma } from './utils/prisma';
import { config } from './config/env';
import { logger } from './utils/logger';
import { WorkerStatus } from '@queueflow/shared';

let heartbeatTimer: NodeJS.Timeout | null = null;
let jobsProcessedCount = 0;
let jobsFailedCount = 0;

export function incrementWorkerStats(status: 'SUCCESS' | 'FAILED') {
  if (status === 'SUCCESS') jobsProcessedCount++;
  else jobsFailedCount++;
}

export async function sendHeartbeat() {
  try {
    await prisma.worker.upsert({
      where: { workerId: config.workerId },
      update: {
        status: WorkerStatus.HEALTHY,
        lastHeartbeat: new Date(),
        jobsProcessed: { increment: jobsProcessedCount },
        jobsFailed: { increment: jobsFailedCount },
      },
      create: {
        workerId: config.workerId,
        status: WorkerStatus.HEALTHY,
        lastHeartbeat: new Date(),
        jobsProcessed: jobsProcessedCount,
        jobsFailed: jobsFailedCount,
      },
    });

    // Reset local counters after flushing to DB
    jobsProcessedCount = 0;
    jobsFailedCount = 0;

    logger.debug({ event: 'worker_heartbeat', workerId: config.workerId }, 'Worker heartbeat sent');
  } catch (error: any) {
    logger.error({ event: 'heartbeat_failed', workerId: config.workerId, error: error.message }, 'Failed to send worker heartbeat');
  }
}

export function startHeartbeatDaemon() {
  // Send initial heartbeat
  sendHeartbeat();
  heartbeatTimer = setInterval(sendHeartbeat, config.heartbeatIntervalMs);
  logger.info({ event: 'heartbeat_started', workerId: config.workerId, intervalMs: config.heartbeatIntervalMs }, 'Worker Heartbeat Daemon initialized');
}

export async function stopHeartbeatDaemon() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  try {
    await prisma.worker.update({
      where: { workerId: config.workerId },
      data: { status: WorkerStatus.OFFLINE },
    });
    logger.info({ event: 'worker_offline', workerId: config.workerId }, 'Worker marked OFFLINE');
  } catch (err) {
    // ignore on shutdown
  }
}
