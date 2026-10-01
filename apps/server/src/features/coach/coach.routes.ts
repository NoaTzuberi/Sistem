import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { loadCoachTrainee } from '../../middleware/coachTrainee.middleware';
import {
  getTrainees,
  getTrainee,
  getTraineePlans,
  getTraineeWorkoutLogs,
  getTraineeBodyMetrics,
} from './coach.controller';

// The human Coach (PRD §6) — the ATLAS AI chat that used /api/coach is gone.
// Read-only in Phase 3; plan building and publishing arrive in Phase 6.
export const coachRouter = Router();

coachRouter.use(requireAuth, requireRole('coach'));

coachRouter.get('/trainees', getTrainees);
coachRouter.get('/trainees/:traineeId', loadCoachTrainee, getTrainee);
coachRouter.get('/trainees/:traineeId/plans', loadCoachTrainee, getTraineePlans);
coachRouter.get('/trainees/:traineeId/workout-logs', loadCoachTrainee, getTraineeWorkoutLogs);
coachRouter.get('/trainees/:traineeId/body-metrics', loadCoachTrainee, getTraineeBodyMetrics);
