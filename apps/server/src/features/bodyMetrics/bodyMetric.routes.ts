import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { readPhotoBody } from '../privatePhotos/privatePhoto.middleware';
import {
  deleteMyBodyMetric,
  deleteMyProgressPhoto,
  getMyBodyMetrics,
  putMyBodyMetric,
  putMyProgressPhoto,
  putMyStartingPhoto,
} from './bodyMetric.controller';

// The trainee's own body tracking (Phase 10, PRD §5.5), one day per :date
// ('YYYY-MM-DD' in her time zone). Every call is scoped to the caller; the coach reads
// a trainee's through /api/coach.
export const bodyMetricsRouter = Router();

bodyMetricsRouter.use(requireAuth, requireRole('trainee'));

bodyMetricsRouter.get('/', getMyBodyMetrics);
bodyMetricsRouter.put('/:date', putMyBodyMetric);
bodyMetricsRouter.delete('/:date', deleteMyBodyMetric);
bodyMetricsRouter.put('/:date/photos/:pose', readPhotoBody, putMyProgressPhoto);
bodyMetricsRouter.put('/:date/starting-photo', readPhotoBody, putMyStartingPhoto);
bodyMetricsRouter.delete('/:date/photos/:pose', deleteMyProgressPhoto);
