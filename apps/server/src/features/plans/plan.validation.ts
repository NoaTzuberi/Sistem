import mongoose from 'mongoose';
import type { SetType } from '@sistem/types';
import { msg, type ServerMessage } from '../../i18n';
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

export function validatePlanIdParam(id: unknown): ServerMessage | null {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
    return msg('plan_invalid_id');
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
  interval?: boolean;
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
  /** undefined = keep the current link; null = clear it. */
  aiRecommendationId?: string | null;
}

/** One problem with the row it belongs to; worded per response (localizeIssues). */
export type PlanProblem = ServerMessage & { workoutIndex?: number; exerciseIndex?: number };

type ParseResult<T> = { value: T; issues: [] } | { value: null; issues: PlanProblem[] };

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

interface NumberRule {
  min: number;
  integer: boolean;
}

const COUNT: NumberRule = { min: 1, integer: true };
const SECONDS_FROM_ZERO: NumberRule = { min: 0, integer: true };
const WEIGHT: NumberRule = { min: 0, integer: false };

/** Reads an optional number; pushes a problem and returns undefined when it is invalid. */
function readNumber(
  source: Record<string, unknown>,
  field: string,
  label: ServerMessage,
  rule: NumberRule,
  problems: ServerMessage[],
): number | undefined {
  const value = source[field];
  if (isMissing(value)) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < rule.min || (rule.integer && !Number.isInteger(value))) {
    problems.push(msg(rule.integer ? 'plan_whole_number_min' : 'plan_number_min', { field: label, min: rule.min }));
    return undefined;
  }
  return value;
}

function readText(source: Record<string, unknown>, field: string, label: ServerMessage, problems: ServerMessage[]): string | undefined {
  const value = source[field];
  if (isMissing(value)) return undefined;
  if (typeof value !== 'string') {
    problems.push(msg('plan_text_not_text', { field: label }));
    return undefined;
  }
  if (value.length > MAX_PLAN_TEXT_LENGTH) {
    problems.push(msg('plan_text_too_long', { field: label, max: MAX_PLAN_TEXT_LENGTH }));
    return undefined;
  }
  return value.trim() || undefined;
}

/** A field label, or 'Set 2: <label>' for a per-set target. */
function fieldLabel(code: Parameters<typeof msg>[0], setNumber: number | null): ServerMessage {
  return setNumber === null ? msg(code) : msg('plan_field_of_set', { n: setNumber, field: msg(code) });
}

function readTargets(source: Record<string, unknown>, setNumber: number | null, problems: ServerMessage[]) {
  return {
    reps: readNumber(source, 'reps', fieldLabel('plan_field_reps', setNumber), COUNT, problems),
    repsMax: readNumber(source, 'repsMax', fieldLabel('plan_field_max_reps', setNumber), COUNT, problems),
    durationSec: readNumber(source, 'durationSec', fieldLabel('plan_field_duration', setNumber), COUNT, problems),
    targetWeight: readNumber(source, 'targetWeight', fieldLabel('plan_field_weight', setNumber), WEIGHT, problems),
    restSec: readNumber(source, 'restSec', fieldLabel('plan_field_rest', setNumber), SECONDS_FROM_ZERO, problems),
  };
}

function parseSetTargets(value: unknown, problems: ServerMessage[]): SetTargetInput[] | undefined {
  if (isMissing(value)) return undefined;
  if (!Array.isArray(value)) {
    problems.push(msg('plan_set_targets_not_list'));
    return undefined;
  }
  if (value.length > MAX_EXERCISE_SETS) {
    problems.push(msg('plan_too_many_sets', { max: MAX_EXERCISE_SETS }));
    return undefined;
  }

  const targets: SetTargetInput[] = [];
  value.forEach((raw, index) => {
    if (!isRecord(raw)) {
      problems.push(msg('plan_set_invalid', { n: index + 1 }));
      return;
    }
    if (typeof raw.type !== 'string' || !(SET_TYPE_IDS as readonly string[]).includes(raw.type)) {
      problems.push(msg('plan_set_unknown_type', { n: index + 1 }));
      return;
    }
    targets.push({ type: raw.type as SetType, ...readTargets(raw, index + 1, problems) });
  });
  return targets.length > 0 ? targets : undefined;
}

function parseExercise(raw: unknown, problems: ServerMessage[]): PlanExerciseInputFields | null {
  if (!isRecord(raw)) {
    problems.push(msg('plan_exercise_invalid'));
    return null;
  }
  if (typeof raw.exerciseId !== 'string' || !mongoose.isValidObjectId(raw.exerciseId)) {
    problems.push(msg('plan_exercise_unknown'));
    return null;
  }

  const before = problems.length;
  const setTargets = parseSetTargets(raw.setTargets, problems);
  const sets = setTargets ? setTargets.length : readNumber(raw, 'sets', msg('plan_field_sets'), COUNT, problems);
  const targets = readTargets(raw, null, problems);
  const notes = readText(raw, 'notes', msg('plan_field_notes'), problems);

  let supersetGroup: string | undefined;
  if (!isMissing(raw.supersetGroup) && raw.supersetGroup !== '') {
    const label = typeof raw.supersetGroup === 'string' ? raw.supersetGroup.trim().toUpperCase() : '';
    if (SUPERSET_GROUP_PATTERN.test(label)) supersetGroup = label;
    else problems.push(msg('plan_superset_label_invalid'));
  }

  let interval: boolean | undefined;
  if (!isMissing(raw.interval)) {
    if (typeof raw.interval === 'boolean') interval = raw.interval || undefined;
    else problems.push(msg('plan_interval_not_boolean'));
  }

  if (sets !== undefined && sets > MAX_EXERCISE_SETS) {
    problems.push(msg('plan_too_many_sets', { max: MAX_EXERCISE_SETS }));
  }
  if (problems.length > before) return null;

  const exercise = { exerciseId: raw.exerciseId, sets, ...targets, setTargets, interval };
  const targetError = validatePlanExerciseTargets(exercise);
  if (targetError || sets === undefined) {
    problems.push(targetError ?? msg('plan_exercise_needs_set'));
    return null;
  }

  return { ...exercise, sets, id: optionalId(raw.id), notes, supersetGroup };
}

/** Structure and per-exercise rules — what even a draft must satisfy to be saved. */
export function parseSavePlanPayload(body: unknown): ParseResult<SavePlanInput> {
  if (!isRecord(body) || !Array.isArray(body.workouts)) {
    return { value: null, issues: [msg('plan_workouts_required')] };
  }
  if (body.workouts.length > MAX_PLAN_WORKOUTS) {
    return { value: null, issues: [msg('plan_too_many_workouts', { max: MAX_PLAN_WORKOUTS })] };
  }

  const issues: PlanProblem[] = [];
  const planProblems: ServerMessage[] = [];
  const notes = readText(body, 'notes', msg('plan_field_plan_notes'), planProblems);
  let aiRecommendationId: string | null | undefined;
  if (body.aiRecommendationId === null) aiRecommendationId = null;
  else if (body.aiRecommendationId !== undefined) {
    if (typeof body.aiRecommendationId === 'string' && mongoose.isValidObjectId(body.aiRecommendationId)) {
      aiRecommendationId = body.aiRecommendationId;
    } else planProblems.push(msg('plan_ai_recommendation_id_invalid'));
  }
  issues.push(...planProblems);

  const workouts: PlanWorkoutInputFields[] = [];
  body.workouts.forEach((raw, workoutIndex) => {
    const problems: ServerMessage[] = [];
    if (!isRecord(raw) || !Array.isArray(raw.exercises)) {
      issues.push({ ...msg('plan_workout_invalid'), workoutIndex });
      return;
    }

    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    if (!title) problems.push(msg('plan_workout_title_required'));
    else if (title.length > MAX_PLAN_TEXT_LENGTH) problems.push(msg('plan_workout_title_too_long'));

    let dayOfWeek: number | undefined;
    if (!isMissing(raw.dayOfWeek)) {
      const day = raw.dayOfWeek;
      if (typeof day === 'number' && Number.isInteger(day) && day >= MIN_DAY_OF_WEEK && day <= MAX_DAY_OF_WEEK) {
        dayOfWeek = day;
      } else {
        problems.push(msg('plan_day_invalid'));
      }
    }

    const workoutNotes = readText(raw, 'notes', msg('plan_field_workout_notes'), problems);
    if (raw.exercises.length > MAX_WORKOUT_EXERCISES) {
      problems.push(msg('plan_too_many_exercises', { max: MAX_WORKOUT_EXERCISES }));
    }
    issues.push(...problems.map((problem) => ({ ...problem, workoutIndex })));

    const exercises: PlanExerciseInputFields[] = [];
    raw.exercises.slice(0, MAX_WORKOUT_EXERCISES).forEach((rawExercise, exerciseIndex) => {
      const exerciseProblems: ServerMessage[] = [];
      const exercise = parseExercise(rawExercise, exerciseProblems);
      if (exercise) exercises.push(exercise);
      issues.push(...exerciseProblems.map((problem) => ({ ...problem, workoutIndex, exerciseIndex })));
    });

    workouts.push({ id: optionalId(raw.id), title, dayOfWeek, notes: workoutNotes, exercises });
  });

  if (issues.length > 0) return { value: null, issues };
  return { value: { notes, workouts, aiRecommendationId }, issues: [] };
}

interface PublishableWorkout {
  exercises: { supersetGroup?: string | null; interval?: boolean | null }[];
}

/**
 * What a plan must satisfy before the trainee may see it, on top of the draft rules:
 * something to train, and supersets that are real groups (2+ exercises, back to back).
 */
export function findPublishIssues(workouts: PublishableWorkout[]): PlanProblem[] {
  if (workouts.length === 0) {
    return [msg('plan_publish_needs_workout')];
  }

  const issues: PlanProblem[] = [];
  workouts.forEach((workout, workoutIndex) => {
    if (workout.exercises.length === 0) {
      issues.push({ ...msg('plan_workout_needs_exercise'), workoutIndex });
      return;
    }

    const positions = new Map<string, number[]>();
    workout.exercises.forEach((exercise, exerciseIndex) => {
      if (!exercise.supersetGroup) return;
      positions.set(exercise.supersetGroup, [...(positions.get(exercise.supersetGroup) ?? []), exerciseIndex]);
    });

    for (const [group, indexes] of positions) {
      if (indexes.length < 2) {
        issues.push({ ...msg('plan_superset_too_small', { group }), workoutIndex, exerciseIndex: indexes[0] });
        continue;
      }
      const firstGap = indexes.findIndex((position, i) => i > 0 && position !== indexes[i - 1] + 1);
      if (firstGap !== -1) {
        issues.push({
          ...msg('plan_superset_not_adjacent', { group }),
          workoutIndex,
          exerciseIndex: indexes[firstGap],
        });
      }
      // A circuit runs as one interval timer: all of its exercises are Interval, or none.
      const intervalFlags = indexes.map((index) => Boolean(workout.exercises[index].interval));
      if (intervalFlags.some(Boolean) && !intervalFlags.every(Boolean)) {
        issues.push({
          ...msg('plan_superset_interval_mixed', { group }),
          workoutIndex,
          exerciseIndex: indexes[intervalFlags.indexOf(false)],
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

export function parseCreatePlanPayload(body: unknown): { value: CreatePlanInput; error: null } | { value: null; error: ServerMessage } {
  if (!isRecord(body) || typeof body.weekStartDate !== 'string' || !isSunday(body.weekStartDate)) {
    return { value: null, error: msg('plan_week_not_sunday') };
  }
  if (!isMissing(body.duplicatePrevious) && typeof body.duplicatePrevious !== 'boolean') {
    return { value: null, error: msg('plan_duplicate_flag_invalid') };
  }
  return { value: { weekStartDate: body.weekStartDate, duplicatePrevious: body.duplicatePrevious === true }, error: null };
}
