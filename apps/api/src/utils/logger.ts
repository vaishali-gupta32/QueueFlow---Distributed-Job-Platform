import pino from 'pino';
import { config } from '../config/env';

export const logger = pino({
  level: config.nodeEnv === 'test' ? 'silent' : 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: ['password', 'passwordHash', 'token', 'jwt', 'authorization', 'headers.authorization', 'payload.password'],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
