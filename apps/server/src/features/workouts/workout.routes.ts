import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  postStartWorkout,
  getActive,
  getList,
  getById,
  getExerciseHistory,
  patchProgress,
  postAbandon,
  postFinish,
} from './workout.controller';

export const workoutsRouter = Router();

workoutsRouter.use(requireAuth);

workoutsRouter.post('/start', postStartWorkout);
workoutsRouter.get('/active', getActive);
workoutsRouter.get('/exercise-history/:exerciseId', getExerciseHistory);
workoutsRouter.get('/', getList);
workoutsRouter.get('/:id', getById);
workoutsRouter.patch('/:id/progress', patchProgress);
workoutsRouter.post('/:id/abandon', postAbandon);
workoutsRouter.post('/:id/finish', postFinish);
