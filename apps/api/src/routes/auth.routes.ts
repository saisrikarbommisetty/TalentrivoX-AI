import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', authMiddleware, AuthController.me);
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/signup', AuthController.register);
router.post('/demo', AuthController.demoLogin);
router.post('/forgot-password', AuthController.forgotPassword);

export default router;
