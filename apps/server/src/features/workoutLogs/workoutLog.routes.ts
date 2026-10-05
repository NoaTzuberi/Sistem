import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  getMyActiveSession,
  getMySession,
  getMyWorkoutLog,
  getMyWorkoutLogs,
  patchMySets,
  postAbandonWorkout,
  postFinishWorkout,
  postStartWorkout,
} from './workoutLog.controller';

// The trainee's own workout logs and the active session (Phase 8, PRD §5.2). Every
// call is scoped to the caller: another trainee's log is simply not found.
export const workoutLogsRouter = Router();

workoutLogsRouter.use(requireAuth);

workoutLogsRouter.get('/', getMyWorkoutLogs);
workoutLogsRouter.post('/', postStartWorkout);
// Before '/:id', or 'active' would be read as a log id.
workoutLogsRouter.get('/active', getMyActiveSession);
workoutLogsRouter.get('/:id', getMyWorkoutLog);
workoutLogsRouter.get('/:id/session', getMySession);
workoutLogsRouter.patch('/:id/sets', patchMySets);
workoutLogsRouter.post('/:id/finish', postFinishWorkout);
workoutLogsRouter.post('/:id/abandon', postAbandonWorkout);
