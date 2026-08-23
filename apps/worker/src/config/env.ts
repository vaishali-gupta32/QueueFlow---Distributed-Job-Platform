import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/queueflow?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  workerId: process.env.WORKER_ID || `worker_${process.pid}_${Math.random().toString(36).substr(2, 5)}`,
  heartbeatIntervalMs: parseInt(process.env.WORKER_HEARTBEAT_INTERVAL || '10000', 10),
  webhookTimeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT || '5000', 10),
  maxJobAttempts: parseInt(process.env.MAX_JOB_ATTEMPTS || '3', 10),
};
