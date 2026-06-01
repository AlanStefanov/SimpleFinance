import { Router } from 'express';
import * as controller from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();
router.post('/login', controller.login);
router.get('/me', authMiddleware, controller.me);

export default router;
