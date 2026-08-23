import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { redisClient } from '../utils/redis';

export async function getLive(req: Request, res: Response) {
  return res.status(200).json({
    status: 'healthy',
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}

export async function getReady(req: Request, res: Response) {
  let dbStatus = 'healthy';
  let redisStatus = 'healthy';
  let isReady = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    dbStatus = 'unhealthy';
    isReady = false;
  }

  try {
    await redisClient.ping();
  } catch (e) {
    redisStatus = 'unhealthy';
    isReady = false;
  }

  const statusCode = isReady ? 200 : 503;

  return res.status(statusCode).json({
    status: isReady ? 'healthy' : 'unhealthy',
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
}

export async function getHealth(req: Request, res: Response) {
  return getReady(req, res);
}
