import { Request, Response } from 'express';
import { validateExerciseListQuery, validateSlugParam } from './exercise.validation';
import { listPublicExercises, getPublicExerciseBySlug, ExerciseNotFoundError } from './exercise.service';
import type { ListExercisesParams } from './exercise.service';
import type {
  Category,
  Muscle,
  Equipment,
  Difficulty,
  MovementType,
  ExerciseGoal,
  Mechanic,
  ForceType,
} from './exercise.constants';

export async function listExercises(req: Request, res: Response) {
  const validationError = validateExerciseListQuery(req.query);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  const query = req.query as Record<string, string | undefined>;
  const params: ListExercisesParams = {
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
    category: query.category as Category | undefined,
    muscle: query.muscle as Muscle | undefined,
    equipment: query.equipment as Equipment | undefined,
    difficulty: query.difficulty as Difficulty | undefined,
    movementType: query.movementType as MovementType | undefined,
    goal: query.goal as ExerciseGoal | undefined,
    mechanic: query.mechanic as Mechanic | undefined,
    forceType: query.forceType as ForceType | undefined,
    isUnilateral: query.isUnilateral === undefined ? undefined : query.isUnilateral === 'true',
    search: query.search,
  };

  const result = await listPublicExercises(params);
  res.status(200).json(result);
}

export async function getExerciseBySlug(req: Request, res: Response) {
  const validationError = validateSlugParam(req.params.slug);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const exercise = await getPublicExerciseBySlug(String(req.params.slug));
    res.status(200).json({ exercise });
  } catch (error) {
    if (error instanceof ExerciseNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    throw error;
  }
}
