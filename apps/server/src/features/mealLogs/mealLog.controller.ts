import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { PhotoStorageUnavailableError } from '../privatePhotos/privatePhoto.service';
import {
  InvalidMealPhotoError,
  MealLogDayError,
  MealLogNoPlanError,
  getCoachMealLogWeek,
  getMyMealLogDays,
  removeMyMealPhoto,
  saveMyMealLog,
  setMyMealPhoto,
} from './mealLog.service';
import {
  parseSaveMealLogPayload,
  validateMealIdParam,
  validateMealLogDateParam,
  validateWeekStartQuery,
} from './mealLog.validation';

/** Maps the portion tracking errors to HTTP; anything else goes to the error handler. */
function sendMealLogError(res: Response, error: unknown): void {
  if (error instanceof MealLogDayError || error instanceof InvalidMealPhotoError) {
    res.status(400).json({ message: error.message });
  } else if (error instanceof MealLogNoPlanError) {
    res.status(409).json({ message: error.message });
  } else if (error instanceof PhotoStorageUnavailableError) {
    res.status(503).json({ message: error.message });
  } else {
    throw error;
  }
}

/** Runs a handler for one day: validates :date (and :mealId when the route has one), maps the errors. */
function withDate(handler: (req: AuthenticatedRequest, res: Response, date: string) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: Response) => {
    const validationError =
      validateMealLogDateParam(req.params.date) ?? (req.params.mealId !== undefined ? validateMealIdParam(req.params.mealId) : null);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }
    try {
      await handler(req, res, req.params.date as string);
    } catch (error) {
      sendMealLogError(res, error);
    }
  };
}

export async function getMyMealLogs(req: AuthenticatedRequest, res: Response) {
  res.status(200).json(await getMyMealLogDays(req.userId!));
}

export const putMyMealLog = withDate(async (req, res, date) => {
  const parsed = parseSaveMealLogPayload(req.body);
  if (!parsed.value) {
    res.status(400).json({ message: parsed.error });
    return;
  }
  res.status(200).json({ day: await saveMyMealLog(req.userId!, date, parsed.value.eaten) });
});

/** The body is the image itself (readPhotoBody); the phone has already compressed it. */
export const putMyMealPhoto = withDate(async (req, res, date) => {
  res.status(200).json({ day: await setMyMealPhoto(req.userId!, date, String(req.params.mealId), req.body as Buffer) });
});

export const deleteMyMealPhoto = withDate(async (req, res, date) => {
  res.status(200).json({ day: await removeMyMealPhoto(req.userId!, date, String(req.params.mealId)) });
});

/** Coach (after loadCoachTrainee): one Sunday week, read-only. */
export async function getTraineeMealLogs(req: AuthenticatedRequest, res: Response) {
  const error = validateWeekStartQuery(req.query.weekStart);
  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  res.status(200).json(await getCoachMealLogWeek(req.traineeId!, (req.query.weekStart as string | undefined) ?? null));
}
