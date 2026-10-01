import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validateWorkoutLogIdParam } from './workoutLog.validation';
import { listWorkoutLogsForTrainee, getWorkoutLogForTrainee, WorkoutLogNotFoundError } from './workoutLog.service';

export async function getMyWorkoutLogs(req: AuthenticatedRequest, res: Response) {
  const logs = await listWorkoutLogsForTrainee(req.userId!);
  res.status(200).json({ items: logs });
}

export async function getMyWorkoutLog(req: AuthenticatedRequest, res: Response) {
  const validationError = validateWorkoutLogIdParam(req.params.id);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const log = await getWorkoutLogForTrainee(String(req.params.id), req.userId!);
    res.status(200).json({ log });
  } catch (error) {
    if (error instanceof WorkoutLogNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    throw error;
  }
}
