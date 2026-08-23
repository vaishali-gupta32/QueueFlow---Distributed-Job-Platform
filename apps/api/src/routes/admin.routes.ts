import { Router } from 'express';
import { listUsers, listWorkers, getDeadLetterJobs, retryDeadLetterJob } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '@queueflow/shared';

const router = Router();

router.use(authenticate);
router.use(requireRole(Role.ADMIN));

router.get('/users', listUsers);
router.get('/workers', listWorkers);
router.get('/dlq', getDeadLetterJobs);
router.post('/jobs/:id/retry', retryDeadLetterJob);

export default router;
