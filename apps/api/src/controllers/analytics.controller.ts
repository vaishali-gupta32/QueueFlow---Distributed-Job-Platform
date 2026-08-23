import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { redisClient } from '../utils/redis';
import { config } from '../config/env';
import { JobStatus, Role, AnalyticsSummary } from '@queueflow/shared';
import { logger } from '../utils/logger';

export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const cacheKey = `analytics:${user.role === Role.ADMIN ? 'system' : `user:${user.id}`}`;

    // 1. Try serving from Redis cache
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug({ event: 'analytics_cache_hit', cacheKey }, 'Analytics served from Redis cache');
        return res.status(200).json({
          success: true,
          data: JSON.parse(cached),
        });
      }
    } catch (err: any) {
      logger.warn({ event: 'analytics_cache_read_error', error: err.message }, 'Failed to read analytics from cache');
    }

    // 2. Compute aggregate statistics from PostgreSQL
    const where: any = {};
    if (user.role !== Role.ADMIN) {
      where.userId = user.id;
    }

    const [
      totalJobs,
      completedJobs,
      failedJobs,
      processingJobs,
      pendingJobs,
      retryingJobs,
      deadLetterJobs,
      avgDurationResult,
    ] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.count({ where: { ...where, status: JobStatus.COMPLETED } }),
      prisma.job.count({ where: { ...where, status: JobStatus.FAILED } }),
      prisma.job.count({ where: { ...where, status: JobStatus.PROCESSING } }),
      prisma.job.count({ where: { ...where, status: JobStatus.PENDING } }),
      prisma.job.count({ where: { ...where, status: JobStatus.RETRYING } }),
      prisma.job.count({ where: { ...where, status: JobStatus.DEAD_LETTER } }),
      prisma.jobAttempt.aggregate({
        _avg: { durationMs: true },
        where: user.role !== Role.ADMIN ? { job: { userId: user.id } } : {},
      }),
    ]);

    const totalFinished = completedJobs + failedJobs + deadLetterJobs;
    const successRate = totalFinished > 0 ? parseFloat(((completedJobs / totalFinished) * 100).toFixed(1)) : 100.0;
    const avgProcessingTimeMs = Math.round(avgDurationResult._avg.durationMs || 0);

    const summary: AnalyticsSummary = {
      totalJobs,
      completedJobs,
      failedJobs,
      processingJobs,
      pendingJobs,
      retryingJobs,
      deadLetterJobs,
      successRate,
      avgProcessingTimeMs,
    };

    // 3. Cache result in Redis for TTL seconds
    try {
      await redisClient.setex(cacheKey, config.redisCacheTtl, JSON.stringify(summary));
    } catch (err: any) {
      logger.warn({ event: 'analytics_cache_write_error', error: err.message }, 'Failed to cache analytics');
    }

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}
