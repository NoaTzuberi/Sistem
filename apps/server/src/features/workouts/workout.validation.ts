import mongoose from 'mongoose';
import { WORKOUT_STATUS_IDS } from './workout.constants';

export function validateIdParam(id: unknown): string | null {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
    return 'A valid workout id is required.';
  }
  return null;
}

export function validateExerciseIdParam(id: unknown): string | null {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
    return 'A valid exercise id is required.';
  }
  return null;
}

export function validateListQuery(query: unknown): string | null {
  if (typeof query !== 'object' || query === null) {
    return 'Invalid query parameters.';
  }

  const params = query as Record<string, unknown>;

  if (params.status !== undefined && !(WORKOUT_STATUS_IDS as readonly string[]).includes(String(params.status))) {
    return 'status must be one of the supported workout status values.';
  }

  if (params.from !== undefined && Number.isNaN(Date.parse(String(params.from)))) {
    return 'from must be a valid ISO date string.';
  }

  if (params.to !== undefined && Number.isNaN(Date.parse(String(params.to)))) {
    return 'to must be a valid ISO date string.';
  }

  return null;
}

interface StartWorkoutInput {
  templateId?: unknown;
}

export function validateStartWorkoutPayload(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return 'Invalid request body.';
  }

  const payload = body as StartWorkoutInput;

  if (typeof payload.templateId !== 'string' || !mongoose.isValidObjectId(payload.templateId)) {
    return 'templateId is required and must be a valid workout template id.';
  }

  return null;
}

interface SetInput {
  setNumber?: unknown;
  weight?: unknown;
  reps?: unknown;
  completed?: unknown;
}

interface ExerciseProgressInput {
  exerciseId?: unknown;
  sets?: unknown;
}

function validateSet(set: unknown, path: string): string | null {
  if (typeof set !== 'object' || set === null) {
    return `${path} must be an object.`;
  }

  const s = set as SetInput;

  if (typeof s.setNumber !== 'number' || !Number.isInteger(s.setNumber) || s.setNumber < 1) {
    return `${path}.setNumber must be a positive integer.`;
  }
  if (typeof s.weight !== 'number' || s.weight < 0) {
    return `${path}.weight must be a non-negative number.`;
  }
  if (typeof s.reps !== 'number' || s.reps < 0) {
    return `${path}.reps must be a non-negative number.`;
  }
  if (typeof s.completed !== 'boolean') {
    return `${path}.completed must be a boolean.`;
  }

  return null;
}

interface ProgressInput {
  exercises?: unknown;
}

export function validateProgressPayload(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return 'Invalid request body.';
  }

  const payload = body as ProgressInput;

  if (!Array.isArray(payload.exercises)) {
    return 'exercises must be an array.';
  }

  for (let i = 0; i < payload.exercises.length; i += 1) {
    const entry = payload.exercises[i] as ExerciseProgressInput;
    if (typeof entry !== 'object' || entry === null) {
      return `exercises[${i}] must be an object.`;
    }
    if (typeof entry.exerciseId !== 'string' || !mongoose.isValidObjectId(entry.exerciseId)) {
      return `exercises[${i}].exerciseId must be a valid exercise id.`;
    }
    if (!Array.isArray(entry.sets)) {
      return `exercises[${i}].sets must be an array.`;
    }
    for (let j = 0; j < entry.sets.length; j += 1) {
      const error = validateSet(entry.sets[j], `exercises[${i}].sets[${j}]`);
      if (error) return error;
    }
  }

  return null;
}

interface FinishWorkoutInput {
  rating?: unknown;
  notes?: unknown;
}

export function validateFinishWorkoutPayload(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return 'Invalid request body.';
  }

  const payload = body as FinishWorkoutInput;

  if (payload.rating !== undefined) {
    if (typeof payload.rating !== 'number' || payload.rating < 1 || payload.rating > 5) {
      return 'rating must be a number between 1 and 5.';
    }
  }

  if (payload.notes !== undefined && typeof payload.notes !== 'string') {
    return 'notes must be a string.';
  }

  return null;
}
