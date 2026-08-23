import { Router } from 'express';
import { createJob, getJobs, getJobById, cancelJob, retryJob } from '../controllers/jobs.controller';
import { authenticate } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = Router();

const jobPostLimiter = createRateLimiter({ max: 100, windowMs: 60000 });

router.use(authenticate);

router.post('/', jobPostLimiter, idempotencyMiddleware, createJob);
router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/:id/cancel', cancelJob);
router.post('/:id/retry', retryJob);

export default router;
