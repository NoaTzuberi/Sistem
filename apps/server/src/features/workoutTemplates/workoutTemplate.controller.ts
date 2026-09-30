import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import {
  validateWorkoutTemplateListQuery,
  validateIdParam,
  validateWorkoutTemplatePayload,
} from './workoutTemplate.validation';
import {
  listWorkoutTemplates,
  getWorkoutTemplateById,
  createWorkoutTemplate,
  updateWorkoutTemplate,
  deleteWorkoutTemplate,
  WorkoutTemplateNotFoundError,
  WorkoutTemplateForbiddenError,
  InvalidExerciseReferenceError,
} from './workoutTemplate.service';
import type { WorkoutTemplateInput } from './workoutTemplate.service';
import type { WorkoutCategory } from './workoutTemplate.constants';

export async function listTemplates(req: AuthenticatedRequest, res: Response) {
  const validationError = validateWorkoutTemplateListQuery(req.query);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  const query = req.query as Record<string, string | undefined>;
  const templates = await listWorkoutTemplates({
    userId: req.userId!,
    category: query.category as WorkoutCategory | undefined,
    mine: query.mine === 'true',
  });

  res.status(200).json({ items: templates });
}

export async function getTemplateById(req: AuthenticatedRequest, res: Response) {
  const validationError = validateIdParam(req.params.id);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const template = await getWorkoutTemplateById(String(req.params.id), req.userId!);
    res.status(200).json({ template });
  } catch (error) {
    if (error instanceof WorkoutTemplateNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    throw error;
  }
}

function parsePayload(req: AuthenticatedRequest): WorkoutTemplateInput {
  const body = req.body as WorkoutTemplateInput;
  return {
    name: body.name,
    description: body.description,
    goal: body.goal,
    difficulty: body.difficulty,
    duration: body.duration,
    category: body.category,
    exercises: body.exercises,
  };
}

export async function createTemplate(req: AuthenticatedRequest, res: Response) {
  const validationError = validateWorkoutTemplatePayload(req.body);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const template = await createWorkoutTemplate(req.userId!, parsePayload(req));
    res.status(201).json({ template });
  } catch (error) {
    if (error instanceof InvalidExerciseReferenceError) {
      res.status(400).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function updateTemplate(req: AuthenticatedRequest, res: Response) {
  const idError = validateIdParam(req.params.id);
  if (idError) {
    res.status(400).json({ message: idError });
    return;
  }

  const validationError = validateWorkoutTemplatePayload(req.body);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const template = await updateWorkoutTemplate(String(req.params.id), req.userId!, parsePayload(req));
    res.status(200).json({ template });
  } catch (error) {
    if (error instanceof WorkoutTemplateNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof WorkoutTemplateForbiddenError) {
      res.status(403).json({ message: error.message });
      return;
    }
    if (error instanceof InvalidExerciseReferenceError) {
      res.status(400).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function deleteTemplate(req: AuthenticatedRequest, res: Response) {
  const validationError = validateIdParam(req.params.id);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    await deleteWorkoutTemplate(String(req.params.id), req.userId!);
    res.status(204).send();
  } catch (error) {
    if (error instanceof WorkoutTemplateNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof WorkoutTemplateForbiddenError) {
      res.status(403).json({ message: error.message });
      return;
    }
    throw error;
  }
}
