import { Router } from 'express';
import { register, login, me, forgotPassword, resetPassword } from './auth.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', requireAuth, me);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
