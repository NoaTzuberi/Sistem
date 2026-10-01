import mongoose from 'mongoose';
import type { PlanIssue, SetType } from '@sistem/types';
import {
  SET_TYPE_IDS,
  MIN_DAY_OF_WEEK,
  MAX_DAY_OF_WEEK,
  SUPERSET_GROUP_PATTERN,
  MAX_PLAN_WORKOUTS,
  MAX_WORKOUT_EXERCISES,
  MAX_EXERCISE_SETS,
  MAX_PLAN_TEXT_LENGTH,
} from './plan.constants';
import { isSunday } from './planWeek';
import { validatePlanExerciseTargets } from './planSets';

export function validatePlanIdParam(id: unknown): string | null {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
    return 'Invalid plan id.';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Plan builder payloads (coach). Every problem is reported with the workout /
// exercise it belongs to, so the builder can show it next to the right row.
// ---------------------------------------------------------------------------

export interface SetTargetInput {
  type: SetType;
  reps?: number;
  repsMax?: number;
  durationSec?: number;
  targetWeight?: number;
  restSec?: number;
}

export interface PlanExerciseInputFields {
  id?: string;
  exerciseId: string;
  sets: number;
  reps?: number;
  repsMax?: number;
  durationSec?: number;
  targetWeight?: number;
  restSec?: number;
  notes?: string;
  supersetGroup?: string;
  setTargets?: SetTargetInput[];
}

export interface PlanWorkoutInputFields {
  id?: string;
  title: string;
  dayOfWeek?: number;
  notes?: string;
  exercises: PlanExerciseInputFields[];
}

export interface SavePlanInput {
  notes?: string;
  workouts: PlanWorkoutInputFields[];
}

type ParseResult<T> = { value: T; issues: [] } | { value: null; issues: PlanIssue[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null;
}

/** An optional id: kept only when it could be a real one (unknown ids get a new id). */
function optionalId(value: unknown): string | undefined {
  return typeof value === 'string' && mongoose.isValidObjectId(value) ? value : undefined;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface NumberRule {
  min: number;
  integer: boolean;
}

const COUNT: NumberRule = { min: 1, integer: true };
const SECONDS_FROM_ZERO: NumberRule = { min: 0, integer: true };
const WEIGHT: NumberRule = { min: 0, integer: false };

/** Reads an optional number; pushes a message and returns undefined when it is invalid. */
function readNumber(
  source: Record<string, unknown>,
  field: string,
  label: string,
  rule: NumberRule,
  problems: string[],
): number | undefined {
  const value = source[field];
  if (isMissing(value)) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < rule.min || (rule.integer && !Number.isInteger(value))) {
    problems.push(`${capitalize(label)} must be ${rule.integer ? 'a whole number' : 'a number'} of at least ${rule.min}.`);
    return undefined;
  }
  return value;
}

function readText(source: Record<string, unknown>, field: string, label: string, problems: string[]): string | undefined {
  const value = source[field];
  if (isMissing(value)) return undefined;
  if (typeof value !== 'string') {
    problems.push(`${label} must be text.`);
    return undefined;
  }
  if (value.length > MAX_PLAN_TEXT_LENGTH) {
    problems.push(`${label} is too long (max ${MAX_PLAN_TEXT_LENGTH} characters).`);
    return undefined;
  }
  return value.trim() || undefined;
}

function readTargets(source: Record<string, unknown>, prefix: string, problems: string[]) {
  return {
    reps: readNumber(source, 'reps', `${prefix}reps`, COUNT, problems),
    repsMax: readNumber(source, 'repsMax', `${prefix}max reps`, COUNT, problems),
    durationSec: readNumber(source, 'durationSec', `${prefix}duration`, COUNT, problems),
    targetWeight: readNumber(source, 'targetWeight', `${prefix}weight`, WEIGHT, problems),
    restSec: readNumber(source, 'restSec', `${prefix}rest`, SECONDS_FROM_ZERO, problems),
  };
}

function parseSetTargets(value: unknown, problems: string[]): SetTargetInput[] | undefined {
  if (isMissing(value)) return undefined;
  if (!Array.isArray(value)) {
    problems.push('Set targets must be a list.');
    return undefined;
  }
  if (value.length > MAX_EXERCISE_SETS) {
    problems.push(`An exercise can have at most ${MAX_EXERCISE_SETS} sets.`);
    return undefined;
  }

  const targets: SetTargetInput[] = [];
  value.forEach((raw, index) => {
    const prefix = `Set ${index + 1}: `;
    if (!isRecord(raw)) {
      problems.push(`${prefix}invalid set.`);
      return;
    }
    if (typeof raw.type !== 'string' || !(SET_TYPE_IDS as readonly string[]).includes(raw.type)) {
      problems.push(`${prefix}unknown set type.`);
      return;
    }
    targets.push({ type: raw.type as SetType, ...readTargets(raw, prefix, problems) });
  });
  return targets.length > 0 ? targets : undefined;
}

function parseExercise(raw: unknown, problems: string[]): PlanExerciseInputFields | null {
  if (!isRecord(raw)) {
    problems.push('Invalid exercise.');
    return null;
  }
  if (typeof raw.exerciseId !== 'string' || !mongoose.isValidObjectId(raw.exerciseId)) {
    problems.push('Unknown exercise.');
    return null;
  }

  const before = problems.length;
  const setTargets = parseSetTargets(raw.setTargets, problems);
  const sets = setTargets ? setTargets.length : readNumber(raw, 'sets', 'Sets', COUNT, problems);
  const targets = readTargets(raw, '', problems);
  const notes = readText(raw, 'notes', 'Notes', problems);

  let supersetGroup: string | undefined;
  if (!isMissing(raw.supersetGroup) && raw.supersetGroup !== '') {
    const label = typeof raw.supersetGroup === 'string' ? raw.supersetGroup.trim().toUpperCase() : '';
    if (SUPERSET_GROUP_PATTERN.test(label)) supersetGroup = label;
    else problems.push('Superset must be a short label such as A or B2.');
  }

  if (sets !== undefined && sets > MAX_EXERCISE_SETS) {
    problems.push(`An exercise can have at most ${MAX_EXERCISE_SETS} sets.`);
  }
  if (problems.length > before) return null;

  const exercise = { exerciseId: raw.exerciseId, sets, ...targets, setTargets };
  const targetError = validatePlanExerciseTargets(exercise);
  if (targetError || sets === undefined) {
    problems.push(targetError ?? 'An exercise needs at least one set.');
    return null;
  }

  return { ...exercise, sets, id: optionalId(raw.id), notes, supersetGroup };
}

/** Structure and per-exercise rules — what even a draft must satisfy to be saved. */
export function parseSavePlanPayload(body: unknown): ParseResult<SavePlanInput> {
  if (!isRecord(body) || !Array.isArray(body.workouts)) {
    return { value: null, issues: [{ message: 'A plan needs a list of workouts.' }] };
  }
  if (body.workouts.length > MAX_PLAN_WORKOUTS) {
    return { value: null, issues: [{ message: `A plan can have at most ${MAX_PLAN_WORKOUTS} workouts.` }] };
  }

  const issues: PlanIssue[] = [];
  const planProblems: string[] = [];
  const notes = readText(body, 'notes', 'Plan notes', planProblems);
  issues.push(...planProblems.map((message) => ({ message })));

  const workouts: PlanWorkoutInputFields[] = [];
  body.workouts.forEach((raw, workoutIndex) => {
    const problems: string[] = [];
    if (!isRecord(raw) || !Array.isArray(raw.exercises)) {
      issues.push({ message: 'Invalid workout.', workoutIndex });
      return;
    }

    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    if (!title) problems.push('A workout needs a title.');
    else if (title.length > MAX_PLAN_TEXT_LENGTH) problems.push('The workout title is too long.');

    let dayOfWeek: number | undefined;
    if (!isMissing(raw.dayOfWeek)) {
      const day = raw.dayOfWeek;
      if (typeof day === 'number' && Number.isInteger(day) && day >= MIN_DAY_OF_WEEK && day <= MAX_DAY_OF_WEEK) {
        dayOfWeek = day;
      } else {
        problems.push('The day must be between Sunday (0) and Saturday (6).');
      }
    }

    const workoutNotes = readText(raw, 'notes', 'Workout notes', problems);
    if (raw.exercises.length > MAX_WORKOUT_EXERCISES) {
      problems.push(`A workout can have at most ${MAX_WORKOUT_EXERCISES} exercises.`);
    }
    issues.push(...problems.map((message) => ({ message, workoutIndex })));

    const exercises: PlanExerciseInputFields[] = [];
    raw.exercises.slice(0, MAX_WORKOUT_EXERCISES).forEach((rawExercise, exerciseIndex) => {
      const exerciseProblems: string[] = [];
      const exercise = parseExercise(rawExercise, exerciseProblems);
      if (exercise) exercises.push(exercise);
      issues.push(...exerciseProblems.map((message) => ({ message, workoutIndex, exerciseIndex })));
    });

    workouts.push({ id: optionalId(raw.id), title, dayOfWeek, notes: workoutNotes, exercises });
  });

  if (issues.length > 0) return { value: null, issues };
  return { value: { notes, workouts }, issues: [] };
}

interface PublishableWorkout {
  exercises: { supersetGroup?: string | null }[];
}

/**
 * What a plan must satisfy before the trainee may see it, on top of the draft rules:
 * something to train, and supersets that are real groups (2+ exercises, back to back).
 */
export function findPublishIssues(workouts: PublishableWorkout[]): PlanIssue[] {
  if (workouts.length === 0) {
    return [{ message: 'A plan needs at least one workout before it can be published.' }];
  }

  const issues: PlanIssue[] = [];
  workouts.forEach((workout, workoutIndex) => {
    if (workout.exercises.length === 0) {
      issues.push({ message: 'A workout needs at least one exercise.', workoutIndex });
      return;
    }

    const positions = new Map<string, number[]>();
    workout.exercises.forEach((exercise, exerciseIndex) => {
      if (!exercise.supersetGroup) return;
      positions.set(exercise.supersetGroup, [...(positions.get(exercise.supersetGroup) ?? []), exerciseIndex]);
    });

    for (const [group, indexes] of positions) {
      if (indexes.length < 2) {
        issues.push({ message: `Superset ${group} needs at least two exercises.`, workoutIndex, exerciseIndex: indexes[0] });
        continue;
      }
      const firstGap = indexes.findIndex((position, i) => i > 0 && position !== indexes[i - 1] + 1);
      if (firstGap !== -1) {
        issues.push({
          message: `Superset ${group} exercises must be next to each other.`,
          workoutIndex,
          exerciseIndex: indexes[firstGap],
        });
      }
    }
  });
  return issues;
}

export interface CreatePlanInput {
  weekStartDate: string;
  duplicatePrevious: boolean;
}

export function parseCreatePlanPayload(body: unknown): { value: CreatePlanInput; error: null } | { value: null; error: string } {
  if (!isRecord(body) || typeof body.weekStartDate !== 'string' || !isSunday(body.weekStartDate)) {
    return { value: null, error: 'weekStartDate must be a Sunday (YYYY-MM-DD).' };
  }
  if (!isMissing(body.duplicatePrevious) && typeof body.duplicatePrevious !== 'boolean') {
    return { value: null, error: 'duplicatePrevious must be true or false.' };
  }
  return { value: { weekStartDate: body.weekStartDate, duplicatePrevious: body.duplicatePrevious === true }, error: null };
}
