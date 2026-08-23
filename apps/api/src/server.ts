import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';

const server = app.listen(config.port, () => {
  logger.info(
    { event: 'api_started', port: config.port, env: config.nodeEnv },
    `QueueFlow API Server listening on port ${config.port}`
  );
  logger.info(`Swagger Documentation available at http://localhost:${config.port}/api/docs`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
