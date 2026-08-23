import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../utils/redis';
import { logger } from '../utils/logger';

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey || req.method !== 'POST') {
    return next();
  }

  const userId = req.user?.id || 'anonymous';
  const redisKey = `idempotency:${userId}:${idempotencyKey}`;

  try {
    const cachedResponse = await redisClient.get(redisKey);
    if (cachedResponse) {
      logger.info({ event: 'idempotency_hit', idempotencyKey, userId }, 'Returning idempotent cached response');
      const parsed = JSON.parse(cachedResponse);
      return res.status(parsed.status).json(parsed.body);
    }

    // Intercept res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redisClient.setex(
          redisKey,
          86400, // 24 hours TTL
          JSON.stringify({ status: res.statusCode, body })
        ).catch((err) => {
          logger.error({ event: 'idempotency_cache_error', error: err.message }, 'Failed to cache idempotency key');
        });
      }
      return originalJson(body);
    };

    next();
  } catch (error: any) {
    logger.error({ event: 'idempotency_middleware_error', error: error.message }, 'Error in idempotency check');
    next();
  }
}
