import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import {
  validateIdParam,
  validateExerciseIdParam,
  validateStartWorkoutPayload,
  validateProgressPayload,
  validateFinishWorkoutPayload,
  validateListQuery,
} from './workout.validation';
import {
  startWorkout,
  getActiveWorkout,
  getWorkoutById,
  updateWorkoutProgress,
  abandonWorkout,
  finishWorkout,
  listWorkoutSummaries,
  getLastLoggedExercise,
  WorkoutNotFoundError,
  WorkoutNotActiveError,
} from './workout.service';
import type { WorkoutStatus } from './workout.constants';

export async function getList(req: AuthenticatedRequest, res: Response) {
  const validationError = validateListQuery(req.query);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  const query = req.query as Record<string, string | undefined>;
  const workouts = await listWorkoutSummaries(req.userId!, {
    from: query.from,
    to: query.to,
    status: query.status as WorkoutStatus | undefined,
  });
  res.status(200).json({ items: workouts });
}

export async function getExerciseHistory(req: AuthenticatedRequest, res: Response) {
  const validationError = validateExerciseIdParam(req.params.exerciseId);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  const history = await getLastLoggedExercise(req.userId!, String(req.params.exerciseId));
  res.status(200).json({ history });
}

export async function postStartWorkout(req: AuthenticatedRequest, res: Response) {
  const validationError = validateStartWorkoutPayload(req.body);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const workout = await startWorkout(req.userId!, req.body.templateId);
    res.status(201).json({ workout });
  } catch (error) {
    if (error instanceof WorkoutNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function getActive(req: AuthenticatedRequest, res: Response) {
  const workout = await getActiveWorkout(req.userId!);
  if (!workout) {
    res.status(404).json({ message: 'No active workout.' });
    return;
  }
  res.status(200).json({ workout });
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  const validationError = validateIdParam(req.params.id);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const workout = await getWorkoutById(String(req.params.id), req.userId!);
    res.status(200).json({ workout });
  } catch (error) {
    if (error instanceof WorkoutNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function patchProgress(req: AuthenticatedRequest, res: Response) {
  const idError = validateIdParam(req.params.id);
  if (idError) {
    res.status(400).json({ message: idError });
    return;
  }

  const validationError = validateProgressPayload(req.body);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const workout = await updateWorkoutProgress(String(req.params.id), req.userId!, req.body.exercises);
    res.status(200).json({ workout });
  } catch (error) {
    if (error instanceof WorkoutNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof WorkoutNotActiveError) {
      res.status(409).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function postAbandon(req: AuthenticatedRequest, res: Response) {
  const validationError = validateIdParam(req.params.id);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const workout = await abandonWorkout(String(req.params.id), req.userId!);
    res.status(200).json({ workout });
  } catch (error) {
    if (error instanceof WorkoutNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof WorkoutNotActiveError) {
      res.status(409).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function postFinish(req: AuthenticatedRequest, res: Response) {
  const idError = validateIdParam(req.params.id);
  if (idError) {
    res.status(400).json({ message: idError });
    return;
  }

  const validationError = validateFinishWorkoutPayload(req.body);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const result = await finishWorkout(String(req.params.id), req.userId!, req.body);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof WorkoutNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof WorkoutNotActiveError) {
      res.status(409).json({ message: error.message });
      return;
    }
    throw error;
  }
}
