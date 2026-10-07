import { Response } from 'express';
import type { Achievement, BodyMetricResponse } from '@sistem/types';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { evaluateAchievementsSafely } from '../achievements/achievement.service';
import { PhotoStorageUnavailableError } from '../privatePhotos/privatePhoto.service';
import { parsePoseParam, parseSaveBodyMetricPayload, validateBodyMetricDateParam } from './bodyMetric.validation';
import {
  BodyMetricDateError,
  InvalidProgressPhotoError,
  deleteBodyMetricDay,
  listBodyMetricsForTrainee,
  removeProgressPhoto,
  saveBodyMetric,
  setProgressPhoto,
} from './bodyMetric.service';

/** Maps the body tracking errors to HTTP; anything else goes to the error handler. */
function sendBodyMetricError(res: Response, error: unknown): void {
  if (error instanceof BodyMetricDateError || error instanceof InvalidProgressPhotoError) {
    res.status(400).json({ message: error.message });
  } else if (error instanceof PhotoStorageUnavailableError) {
    res.status(503).json({ message: error.message });
  } else {
    throw error;
  }
}

/** Runs a handler for one day: validates :date, maps the errors. */
function withDate(handler: (req: AuthenticatedRequest, res: Response, date: string) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: Response) => {
    const validationError = validateBodyMetricDateParam(req.params.date);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }
    try {
      await handler(req, res, req.params.date as string);
    } catch (error) {
      sendBodyMetricError(res, error);
    }
  };
}

function sendDay(res: Response, metric: BodyMetricResponse['metric'], achievementsUnlocked?: Achievement[]): void {
  const body: BodyMetricResponse = { metric, ...(achievementsUnlocked && { achievementsUnlocked }) };
  res.status(200).json(body);
}

/** After a save: the achievements it unlocked (PRD §7), shown at once on her phone. */
async function sendSavedDay(res: Response, traineeId: string, metric: BodyMetricResponse['metric']): Promise<void> {
  sendDay(res, metric, await evaluateAchievementsSafely(traineeId));
}

export async function getMyBodyMetrics(req: AuthenticatedRequest, res: Response) {
  res.status(200).json(await listBodyMetricsForTrainee(req.userId!));
}

export const putMyBodyMetric = withDate(async (req, res, date) => {
  const parsed = parseSaveBodyMetricPayload(req.body);
  if (parsed.error !== undefined) {
    res.status(400).json({ message: parsed.error });
    return;
  }
  await sendSavedDay(res, req.userId!, await saveBodyMetric(req.userId!, date, parsed.value));
});

export const deleteMyBodyMetric = withDate(async (req, res, date) => {
  await deleteBodyMetricDay(req.userId!, date);
  res.status(204).end();
});

/** The body is the image itself (readPhotoBody); the phone has already compressed it. */
export const putMyProgressPhoto = withDate(async (req, res, date) => {
  const pose = parsePoseParam(req.params.pose);
  if (pose.error !== undefined) {
    res.status(400).json({ message: pose.error });
    return;
  }
  await sendSavedDay(res, req.userId!, await setProgressPhoto(req.userId!, date, pose.value, req.body as Buffer));
});

export const deleteMyProgressPhoto = withDate(async (req, res, date) => {
  const pose = parsePoseParam(req.params.pose);
  if (pose.error !== undefined) {
    res.status(400).json({ message: pose.error });
    return;
  }
  sendDay(res, await removeProgressPhoto(req.userId!, date, pose.value));
});
