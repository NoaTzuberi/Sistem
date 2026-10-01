import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { getMyWorkoutLogs, getMyWorkoutLog } from './workoutLog.controller';

// Read-only for now; starting/logging/finishing a workout arrives in Phase 8.
export const workoutLogsRouter = Router();

workoutLogsRouter.use(requireAuth);

workoutLogsRouter.get('/', getMyWorkoutLogs);
workoutLogsRouter.get('/:id', getMyWorkoutLog);
