import { Router } from 'express';
import { getProfile, patchPreferences } from './users.controller';
import { requireAuth } from '../../middleware/auth.middleware';

// Onboarding answers are written through /api/onboarding (Phase 3).
export const usersRouter = Router();

usersRouter.get('/profile', requireAuth, getProfile);
// Display units for body tracking (Phase 10, Settings).
usersRouter.patch('/preferences', requireAuth, patchPreferences);
