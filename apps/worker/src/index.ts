import { startWorkerProcessor } from './processor';
import { startHeartbeatDaemon, stopHeartbeatDaemon } from './heartbeat';
import { logger } from './utils/logger';

async function bootstrap() {
  logger.info({ event: 'worker_bootstrap' }, 'Bootstrapping QueueFlow Worker Service...');

  // Start heartbeat daemon
  startHeartbeatDaemon();

  // Start job queue consumer processor
  const worker = startWorkerProcessor();

  const shutdown = async () => {
    logger.info('Shutting down worker process...');
    await stopHeartbeatDaemon();
    await worker.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error({ event: 'worker_bootstrap_error', error: err.message }, 'Fatal error starting worker');
  process.exit(1);
});
