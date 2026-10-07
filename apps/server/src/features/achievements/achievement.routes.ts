import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { getMyAchievements, postAchievementsSeen } from './achievement.controller';

// Achievements are only ever awarded by the server (after saves); the trainee reads
// them and marks their celebration as shown. The coach reads hers via /api/coach.
export const achievementsRouter = Router();

achievementsRouter.use(requireAuth, requireRole('trainee'));

achievementsRouter.get('/', getMyAchievements);
achievementsRouter.post('/seen', postAchievementsSeen);
