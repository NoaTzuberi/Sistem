import { Response } from 'express';
import type { ActiveWorkoutConflictBody } from '@sistem/types';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { PlanNotFoundError } from '../plans/plan.service';
import { parseSetUpdates, parseStartWorkoutPayload, validateWorkoutLogIdParam } from './workoutLog.validation';
import { listWorkoutLogsForTrainee, getWorkoutLogForTrainee, WorkoutLogNotFoundError } from './workoutLog.service';
import {
  abandonWorkout,
  finishWorkout,
  getActiveSession,
  getSession,
  NothingCompletedError,
  OtherWorkoutActiveError,
  startWorkout,
  UnknownLogSetError,
  updateWorkoutSets,
  WorkoutLogNotActiveError,
  WorkoutNotStartableError,
} from './workoutSession.service';

/** Maps the session errors to HTTP; anything else goes to the error handler. */
function sendSessionError(res: Response, error: unknown): void {
  if (error instanceof WorkoutLogNotFoundError || error instanceof PlanNotFoundError) {
    res.status(404).json({ message: error.message });
  } else if (error instanceof OtherWorkoutActiveError) {
    const body: ActiveWorkoutConflictBody = {
      message: error.message,
      code: 'other_workout_active',
      activeLog: error.activeLog,
    };
    res.status(409).json(body);
  } else if (error instanceof WorkoutNotStartableError || error instanceof WorkoutLogNotActiveError) {
    res.status(409).json({ message: error.message });
  } else if (error instanceof NothingCompletedError || error instanceof UnknownLogSetError) {
    res.status(400).json({ message: error.message });
  } else {
    throw error;
  }
}

/** Runs a handler for one log id: validates the id, maps the session errors. */
function withLogId(handler: (req: AuthenticatedRequest, res: Response, logId: string) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: Response) => {
    const validationError = validateWorkoutLogIdParam(req.params.id);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }
    try {
      await handler(req, res, String(req.params.id));
    } catch (error) {
      sendSessionError(res, error);
    }
  };
}

export async function getMyWorkoutLogs(req: AuthenticatedRequest, res: Response) {
  const logs = await listWorkoutLogsForTrainee(req.userId!);
  res.status(200).json({ items: logs });
}

export const getMyWorkoutLog = withLogId(async (req, res, logId) => {
  res.status(200).json({ log: await getWorkoutLogForTrainee(logId, req.userId!) });
});

/** Her open session (any device), or null. */
export async function getMyActiveSession(req: AuthenticatedRequest, res: Response) {
  res.status(200).json({ session: await getActiveSession(req.userId!) });
}

export async function postStartWorkout(req: AuthenticatedRequest, res: Response) {
  const parsed = parseStartWorkoutPayload(req.body);
  if (parsed.error !== undefined) {
    res.status(400).json({ message: parsed.error });
    return;
  }
  try {
    const { session, resumed } = await startWorkout(req.userId!, parsed.value.planId, parsed.value.workoutId);
    res.status(resumed ? 200 : 201).json({ session });
  } catch (error) {
    sendSessionError(res, error);
  }
}

export const getMySession = withLogId(async (req, res, logId) => {
  res.status(200).json({ session: await getSession(logId, req.userId!) });
});

export const patchMySets = withLogId(async (req, res, logId) => {
  const parsed = parseSetUpdates(req.body);
  if (parsed.error !== undefined) {
    res.status(400).json({ message: parsed.error });
    return;
  }
  res.status(200).json({ log: await updateWorkoutSets(logId, req.userId!, parsed.value) });
});

export const postFinishWorkout = withLogId(async (req, res, logId) => {
  const parsed = parseSetUpdates(req.body, { optional: true });
  if (parsed.error !== undefined) {
    res.status(400).json({ message: parsed.error });
    return;
  }
  res.status(200).json({ log: await finishWorkout(logId, req.userId!, parsed.value) });
});

export const postAbandonWorkout = withLogId(async (req, res, logId) => {
  res.status(200).json({ log: await abandonWorkout(logId, req.userId!) });
});
