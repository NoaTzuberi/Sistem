import { Router } from 'express';
import { listExercises, getExerciseBySlug } from './exercise.controller';

export const exercisesRouter = Router();

exercisesRouter.get('/', listExercises);
exercisesRouter.get('/:slug', getExerciseBySlug);
