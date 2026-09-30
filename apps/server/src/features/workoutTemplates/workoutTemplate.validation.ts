import mongoose from 'mongoose';
import { DIFFICULTY_IDS } from '../exercises/exercise.constants';
import { WORKOUT_CATEGORY_IDS, WORKOUT_GOAL_IDS } from './workoutTemplate.constants';

function isStringInSet(value: unknown, allowed: readonly string[]): boolean {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

export function validateWorkoutTemplateListQuery(query: unknown): string | null {
  if (typeof query !== 'object' || query === null) {
    return 'Invalid query parameters.';
  }

  const params = query as Record<string, unknown>;

  if (params.category !== undefined && !isStringInSet(params.category, WORKOUT_CATEGORY_IDS)) {
    return 'category must be one of the supported workout category values.';
  }

  if (params.mine !== undefined && params.mine !== 'true' && params.mine !== 'false') {
    return "mine must be 'true' or 'false'.";
  }

  return null;
}

export function validateIdParam(id: unknown): string | null {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
    return 'A valid workout template id is required.';
  }
  return null;
}

interface ExerciseEntryInput {
  exerciseId?: unknown;
  order?: unknown;
  defaultSets?: unknown;
  defaultReps?: unknown;
  defaultWeight?: unknown;
  restTime?: unknown;
}

function validateExerciseEntry(entry: unknown, index: number): string | null {
  if (typeof entry !== 'object' || entry === null) {
    return `exercises[${index}] must be an object.`;
  }

  const e = entry as ExerciseEntryInput;

  if (typeof e.exerciseId !== 'string' || !mongoose.isValidObjectId(e.exerciseId)) {
    return `exercises[${index}].exerciseId must be a valid exercise id.`;
  }

  if (typeof e.order !== 'number' || !Number.isInteger(e.order) || e.order < 0) {
    return `exercises[${index}].order must be a non-negative integer.`;
  }

  if (typeof e.defaultSets !== 'number' || !Number.isInteger(e.defaultSets) || e.defaultSets < 1) {
    return `exercises[${index}].defaultSets must be a positive integer.`;
  }

  if (typeof e.defaultReps !== 'string' || e.defaultReps.trim().length === 0) {
    return `exercises[${index}].defaultReps is required.`;
  }

  if (e.defaultWeight !== undefined && (typeof e.defaultWeight !== 'number' || e.defaultWeight < 0)) {
    return `exercises[${index}].defaultWeight must be a non-negative number.`;
  }

  if (e.restTime !== undefined && (typeof e.restTime !== 'number' || e.restTime < 0)) {
    return `exercises[${index}].restTime must be a non-negative number.`;
  }

  return null;
}

interface WorkoutTemplateInput {
  name?: unknown;
  description?: unknown;
  goal?: unknown;
  difficulty?: unknown;
  duration?: unknown;
  category?: unknown;
  exercises?: unknown;
}

export function validateWorkoutTemplatePayload(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return 'Invalid request body.';
  }

  const payload = body as WorkoutTemplateInput;

  if (typeof payload.name !== 'string' || payload.name.trim().length === 0) {
    return 'name is required.';
  }

  if (payload.description !== undefined && typeof payload.description !== 'string') {
    return 'description must be a string.';
  }

  if (payload.goal !== undefined) {
    if (!Array.isArray(payload.goal) || payload.goal.some((g) => !isStringInSet(g, WORKOUT_GOAL_IDS))) {
      return 'goal must be an array of supported goal values.';
    }
  }

  if (payload.difficulty !== undefined && !isStringInSet(payload.difficulty, DIFFICULTY_IDS)) {
    return 'difficulty must be one of the supported difficulty values.';
  }

  if (payload.duration !== undefined && (typeof payload.duration !== 'number' || payload.duration <= 0)) {
    return 'duration must be a positive number.';
  }

  if (payload.category !== undefined && !isStringInSet(payload.category, WORKOUT_CATEGORY_IDS)) {
    return 'category must be one of the supported workout category values.';
  }

  if (!Array.isArray(payload.exercises) || payload.exercises.length === 0) {
    return 'exercises must be a non-empty array.';
  }

  for (let i = 0; i < payload.exercises.length; i += 1) {
    const error = validateExerciseEntry(payload.exercises[i], i);
    if (error) return error;
  }

  return null;
}
