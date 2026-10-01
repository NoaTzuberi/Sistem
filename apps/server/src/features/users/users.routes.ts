import { Router } from 'express';
import { getProfile } from './users.controller';
import { requireAuth } from '../../middleware/auth.middleware';

// Onboarding answers are written through /api/onboarding (Phase 3).
export const usersRouter = Router();

usersRouter.get('/profile', requireAuth, getProfile);
