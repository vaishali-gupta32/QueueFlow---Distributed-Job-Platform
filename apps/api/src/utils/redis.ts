import Redis from 'ioredis';
import { config } from '../config/env';
import { logger } from './logger';

export const redisClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
});

redisClient.on('connect', () => {
  logger.info({ event: 'redis_connected' }, 'Connected to Redis server');
});

redisClient.on('error', (err) => {
  logger.error({ event: 'redis_error', error: err.message }, 'Redis connection error');
});
