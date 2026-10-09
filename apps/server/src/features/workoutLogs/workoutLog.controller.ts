import { Response } from 'express';
import type { ActiveWorkoutConflictBody } from '@sistem/types';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { PlanNotFoundError } from '../plans/plan.service';
import { PhotoStorageUnavailableError } from '../privatePhotos/privatePhoto.service';
import { parseSetUpdates, parseStartWorkoutPayload, parseSummaryPayload, validateWorkoutLogIdParam } from './workoutLog.validation';
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
import {
  InvalidPhotoError,
  WorkoutLogNotCompletedError,
  removePumpPhoto,
  setPumpPhoto,
  updateWorkoutSummary,
} from './workoutSummary.service';
import { sendError } from '../../i18n';

/** Maps the session and summary errors to HTTP; anything else goes to the error handler. */
function sendSessionError(res: Response, error: unknown): void {
  if (error instanceof WorkoutLogNotFoundError || error instanceof PlanNotFoundError) {
    sendError(res, 404, error.serverMessage);
  } else if (error instanceof OtherWorkoutActiveError) {
    const body: ActiveWorkoutConflictBody = {
      message: error.message,
      code: 'other_workout_active',
      activeLog: error.activeLog,
    };
    res.status(409).json(body);
  } else if (
    error instanceof WorkoutNotStartableError ||
    error instanceof WorkoutLogNotActiveError ||
    error instanceof WorkoutLogNotCompletedError
  ) {
    sendError(res, 409, error.serverMessage);
  } else if (error instanceof NothingCompletedError || error instanceof UnknownLogSetError || error instanceof InvalidPhotoError) {
    sendError(res, 400, error.serverMessage);
  } else if (error instanceof PhotoStorageUnavailableError) {
    sendError(res, 503, error.serverMessage);
  } else {
    throw error;
  }
}

/** Runs a handler for one log id: validates the id, maps the session errors. */
function withLogId(handler: (req: AuthenticatedRequest, res: Response, logId: string) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: Response) => {
    const validationError = validateWorkoutLogIdParam(req.params.id);
    if (validationError) {
      sendError(res, 400, validationError);
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
    sendError(res, 400, parsed.error);
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
    sendError(res, 400, parsed.error);
    return;
  }
  res.status(200).json({ log: await updateWorkoutSets(logId, req.userId!, parsed.value) });
});

export const postFinishWorkout = withLogId(async (req, res, logId) => {
  const parsed = parseSetUpdates(req.body, { optional: true });
  if (parsed.error !== undefined) {
    sendError(res, 400, parsed.error);
    return;
  }
  res.status(200).json({ log: await finishWorkout(logId, req.userId!, parsed.value) });
});

export const postAbandonWorkout = withLogId(async (req, res, logId) => {
  res.status(200).json({ log: await abandonWorkout(logId, req.userId!) });
});

// --- The summary (Phase 9, PRD §5.3) — her own finished workouts only.

export const patchMySummary = withLogId(async (req, res, logId) => {
  const parsed = parseSummaryPayload(req.body);
  if (parsed.error !== undefined) {
    sendError(res, 400, parsed.error);
    return;
  }
  res.status(200).json({ log: await updateWorkoutSummary(logId, req.userId!, parsed.value) });
});

/** The body is the image itself (readPhotoBody); the phone has already compressed it. */
export const putMyPumpPhoto = withLogId(async (req, res, logId) => {
  res.status(200).json({ log: await setPumpPhoto(logId, req.userId!, req.body as Buffer) });
});

export const deleteMyPumpPhoto = withLogId(async (req, res, logId) => {
  res.status(200).json({ log: await removePumpPhoto(logId, req.userId!) });
});
