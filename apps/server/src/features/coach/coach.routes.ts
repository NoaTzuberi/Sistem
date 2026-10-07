import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { loadCoachTrainee } from '../../middleware/coachTrainee.middleware';
import {
  getTrainees,
  getExercises,
  getTrainee,
  getTraineePlans,
  getTraineePlanWeeks,
  getTraineeWorkoutLogs,
  getTraineeBodyMetrics,
  getTraineeAchievements,
  createTraineePlan,
  getTraineePlan,
  saveTraineePlan,
  publishTraineePlan,
  unpublishTraineePlan,
  deleteTraineePlan,
} from './coach.controller';

// The human Coach (PRD §6) — the ATLAS AI chat that used /api/coach is gone.
// Every route needs role=coach; every :traineeId route also needs that trainee to
// be hers (loadCoachTrainee), and plans are looked up inside that trainee only.
export const coachRouter = Router();

coachRouter.use(requireAuth, requireRole('coach'));

coachRouter.get('/exercises', getExercises);

coachRouter.get('/trainees', getTrainees);
coachRouter.get('/trainees/:traineeId', loadCoachTrainee, getTrainee);
coachRouter.get('/trainees/:traineeId/workout-logs', loadCoachTrainee, getTraineeWorkoutLogs);
coachRouter.get('/trainees/:traineeId/body-metrics', loadCoachTrainee, getTraineeBodyMetrics);
coachRouter.get('/trainees/:traineeId/achievements', loadCoachTrainee, getTraineeAchievements);

// Plan builder (Phase 6).
coachRouter.get('/trainees/:traineeId/plans', loadCoachTrainee, getTraineePlans);
coachRouter.get('/trainees/:traineeId/plan-weeks', loadCoachTrainee, getTraineePlanWeeks);
coachRouter.post('/trainees/:traineeId/plans', loadCoachTrainee, createTraineePlan);
coachRouter.get('/trainees/:traineeId/plans/:planId', loadCoachTrainee, getTraineePlan);
coachRouter.put('/trainees/:traineeId/plans/:planId', loadCoachTrainee, saveTraineePlan);
coachRouter.delete('/trainees/:traineeId/plans/:planId', loadCoachTrainee, deleteTraineePlan);
coachRouter.post('/trainees/:traineeId/plans/:planId/publish', loadCoachTrainee, publishTraineePlan);
coachRouter.post('/trainees/:traineeId/plans/:planId/unpublish', loadCoachTrainee, unpublishTraineePlan);
