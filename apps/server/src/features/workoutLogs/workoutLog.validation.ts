import mongoose from 'mongoose';
import type { StartWorkoutPayload, WorkoutLogSetUpdate, WorkoutSummaryPayload } from '@sistem/types';
import {
  MAX_LOGGED_DURATION_SEC,
  MAX_LOGGED_REPS,
  MAX_LOGGED_WEIGHT,
  MAX_NOTES_LENGTH,
  MAX_RATING,
  MAX_SET_UPDATES,
  MIN_RATING,
} from './workoutLog.constants';

export function validateWorkoutLogIdParam(id: unknown): string | null {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
    return 'Invalid workout log id.';
  }
  return null;
}

type Result<T> = { value: T; error?: undefined } | { value?: undefined; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseStartWorkoutPayload(body: unknown): Result<StartWorkoutPayload> {
  if (!isObject(body) || !mongoose.isValidObjectId(body.planId) || !mongoose.isValidObjectId(body.workoutId)) {
    return { error: 'planId and workoutId are required.' };
  }
  return { value: { planId: String(body.planId), workoutId: String(body.workoutId) } };
}

/** undefined = leave as is · null = clear · otherwise a number in range. */
function isOptionalAmount(value: unknown, max: number, integer: boolean): value is number | null | undefined {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) return false;
  return !integer || Number.isInteger(value);
}

function parseSetUpdate(raw: unknown, index: number): Result<WorkoutLogSetUpdate> {
  const label = `Set update ${index + 1}`;
  if (!isObject(raw)) return { error: `${label} must be an object.` };
  if (!mongoose.isValidObjectId(raw.planExerciseId)) return { error: `${label}: invalid planExerciseId.` };
  if (typeof raw.setIndex !== 'number' || !Number.isInteger(raw.setIndex) || raw.setIndex < 0) {
    return { error: `${label}: invalid setIndex.` };
  }
  if (typeof raw.completed !== 'boolean') return { error: `${label}: completed must be true or false.` };
  if (!isOptionalAmount(raw.reps, MAX_LOGGED_REPS, true)) return { error: `${label}: invalid reps.` };
  if (!isOptionalAmount(raw.weight, MAX_LOGGED_WEIGHT, false)) return { error: `${label}: invalid weight.` };
  if (!isOptionalAmount(raw.durationSec, MAX_LOGGED_DURATION_SEC, true)) return { error: `${label}: invalid duration.` };

  return {
    value: {
      planExerciseId: String(raw.planExerciseId),
      setIndex: raw.setIndex,
      completed: raw.completed,
      ...(raw.reps !== undefined && { reps: raw.reps }),
      ...(raw.weight !== undefined && { weight: raw.weight }),
      ...(raw.durationSec !== undefined && { durationSec: raw.durationSec }),
    },
  };
}

/** `{ sets: [...] }`. With `optional`, a missing body or missing `sets` means no changes. */
export function parseSetUpdates(body: unknown, { optional = false } = {}): Result<WorkoutLogSetUpdate[]> {
  if (optional && (body === undefined || (isObject(body) && body.sets === undefined))) return { value: [] };
  if (!isObject(body) || !Array.isArray(body.sets)) return { error: 'sets must be an array.' };
  if (body.sets.length > MAX_SET_UPDATES) return { error: `At most ${MAX_SET_UPDATES} set updates at once.` };

  const updates: WorkoutLogSetUpdate[] = [];
  for (const [index, raw] of body.sets.entries()) {
    const parsed = parseSetUpdate(raw, index);
    if (parsed.error !== undefined) return { error: parsed.error };
    updates.push(parsed.value);
  }
  return { value: updates };
}

/** `{ rating?, notes? }`: null clears; empty notes clear too. */
export function parseSummaryPayload(body: unknown): Result<WorkoutSummaryPayload> {
  if (!isObject(body)) return { error: 'The summary must be an object.' };
  const value: WorkoutSummaryPayload = {};

  if (body.rating === null) value.rating = null;
  else if (body.rating !== undefined) {
    if (typeof body.rating !== 'number' || !Number.isInteger(body.rating) || body.rating < MIN_RATING || body.rating > MAX_RATING) {
      return { error: `rating must be a whole number from ${MIN_RATING} to ${MAX_RATING}.` };
    }
    value.rating = body.rating;
  }

  if (body.notes === null) value.notes = null;
  else if (body.notes !== undefined) {
    if (typeof body.notes !== 'string') return { error: 'notes must be text.' };
    const notes = body.notes.trim();
    if (notes.length > MAX_NOTES_LENGTH) return { error: `notes can be at most ${MAX_NOTES_LENGTH} characters.` };
    value.notes = notes === '' ? null : notes;
  }
  return { value };
}
