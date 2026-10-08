import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { readPhotoBody } from '../privatePhotos/privatePhoto.middleware';
import { deleteMyMealPhoto, getMyMealLogs, putMyMealLog, putMyMealPhoto } from './mealLog.controller';

// The trainee's portion tracking (Phase 13a+, PRD §5.6), one day per :date ('YYYY-MM-DD'
// in her time zone, today and the 6 days before). Every call is scoped to the caller; the
// coach reads a trainee's week through /api/coach.
export const mealLogsRouter = Router();

mealLogsRouter.use(requireAuth, requireRole('trainee'));

mealLogsRouter.get('/', getMyMealLogs);
mealLogsRouter.put('/:date', putMyMealLog);
mealLogsRouter.put('/:date/photos/:mealId', readPhotoBody, putMyMealPhoto);
mealLogsRouter.delete('/:date/photos/:mealId', deleteMyMealPhoto);
