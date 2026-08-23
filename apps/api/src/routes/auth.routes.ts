import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = Router();

const authRateLimiter = createRateLimiter({ max: 20, windowMs: 60000 });

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', authenticate, getMe);

export default router;
