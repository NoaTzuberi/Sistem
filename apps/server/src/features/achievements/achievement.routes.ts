import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { getMyAchievements } from './achievement.controller';

// Read-only: achievements are only ever awarded by the server (Phase 11).
export const achievementsRouter = Router();

achievementsRouter.use(requireAuth);

achievementsRouter.get('/', getMyAchievements);
