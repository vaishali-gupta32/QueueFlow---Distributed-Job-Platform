import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../utils/redis';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export function createRateLimiter(options?: { max?: number; windowMs?: number }) {
  const maxRequests = options?.max || config.rateLimitMax;
  const windowMs = options?.windowMs || config.rateLimitWindowMs;
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.user?.id || req.ip || 'anonymous';
    const redisKey = `rate_limit:${identifier}:${req.path}`;

    try {
      const currentCount = await redisClient.incr(redisKey);

      if (currentCount === 1) {
        await redisClient.expire(redisKey, windowSeconds);
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount));

      if (currentCount > maxRequests) {
        logger.warn({ event: 'rate_limit_exceeded', identifier, path: req.path }, 'Rate limit exceeded');
        return res.status(429).json({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowSeconds}s.`,
          },
        });
      }

      next();
    } catch (err: any) {
      // If Redis fails, log and allow request through safely
      logger.error({ event: 'rate_limiter_bypass', error: err.message }, 'Redis rate limit error, allowing request');
      next();
    }
  };
}
