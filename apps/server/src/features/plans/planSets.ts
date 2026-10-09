import type { ResolvedPlanSet, SetType } from '@sistem/types';
import { DEFAULT_SET_TYPE } from './plan.constants';
import { msg, type ServerMessage } from '../../i18n';

/** Target fields shared by a whole PlanExercise and by one entry of setTargets. */
interface SetTargetInput {
  type?: SetType;
  reps?: number | null;
  repsMax?: number | null;
  durationSec?: number | null;
  targetWeight?: number | null;
  restSec?: number | null;
}

export interface PlanExerciseTargetsInput extends SetTargetInput {
  sets?: number | null;
  setTargets?: SetTargetInput[] | null;
  interval?: boolean | null;
}

function isSet(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function hasSetTargets(exercise: PlanExerciseTargetsInput): exercise is PlanExerciseTargetsInput & { setTargets: SetTargetInput[] } {
  return Array.isArray(exercise.setTargets) && exercise.setTargets.length > 0;
}

// Only defined values are copied, so API responses never carry `null` targets.
function toResolvedSet(setIndex: number, source: SetTargetInput): ResolvedPlanSet {
  const resolved: ResolvedPlanSet = { setIndex, type: source.type ?? DEFAULT_SET_TYPE };
  if (isSet(source.reps)) resolved.reps = source.reps;
  if (isSet(source.repsMax)) resolved.repsMax = source.repsMax;
  if (isSet(source.durationSec)) resolved.durationSec = source.durationSec;
  if (isSet(source.targetWeight)) resolved.targetWeight = source.targetWeight;
  if (isSet(source.restSec)) resolved.restSec = source.restSec;
  return resolved;
}

/**
 * The one place that turns a PlanExercise into its concrete sets. setTargets, when
 * present, defines every set on its own (no fallback to the uniform fields);
 * otherwise the uniform fields apply to each of `sets` working sets. The API returns
 * the result as `resolvedSets`, so the trainee app, log pre-fill and coach views all
 * read the same list.
 */
export function resolvePlanExerciseSets(exercise: PlanExerciseTargetsInput): ResolvedPlanSet[] {
  if (hasSetTargets(exercise)) {
    return exercise.setTargets.map((target, index) => toResolvedSet(index, target));
  }

  const count = isSet(exercise.sets) ? Math.max(0, Math.floor(exercise.sets)) : 0;
  const uniform: SetTargetInput = { ...exercise, type: DEFAULT_SET_TYPE };
  return Array.from({ length: count }, (_, index) => toResolvedSet(index, uniform));
}

/** With setTargets, `sets` is derived from its length; otherwise it is kept. */
export function deriveSetCount(exercise: PlanExerciseTargetsInput): number | undefined {
  if (hasSetTargets(exercise)) return exercise.setTargets.length;
  return isSet(exercise.sets) ? exercise.sets : undefined;
}

/** `setNumber` null = the exercise's own targets (no per-set list). */
function validateTarget(target: SetTargetInput, setNumber: number | null): ServerMessage | null {
  const subject = setNumber === null ? msg('plan_subject_exercise') : msg('plan_subject_set', { n: setNumber });
  if (!isSet(target.reps) && !isSet(target.durationSec)) {
    return msg('plan_target_needs_amount', { subject });
  }
  if (isSet(target.repsMax)) {
    if (!isSet(target.reps)) return msg('plan_target_range_needs_reps', { subject });
    if (target.repsMax < target.reps) return msg('plan_target_range_inverted', { subject });
  }
  return null;
}

/**
 * Rules for a PlanExercise's targets (used by the schema and by request validation
 * in the plan builder). Returns the first problem, or null.
 */
export function validatePlanExerciseTargets(exercise: PlanExerciseTargetsInput): ServerMessage | null {
  const error = validateSetTargets(exercise);
  if (error) return error;
  // Interval mode runs on time alone: every set is a hold, none counts reps.
  // Fields are read directly: the schema hook passes a Mongoose subdocument, which
  // can't be spread like the plain objects the builder sends.
  const sets: SetTargetInput[] = hasSetTargets(exercise) ? exercise.setTargets : [exercise];
  if (exercise.interval && sets.some((set) => !isSet(set.durationSec) || isSet(set.reps))) {
    return msg('plan_interval_needs_durations');
  }
  return null;
}

function validateSetTargets(exercise: PlanExerciseTargetsInput): ServerMessage | null {
  if (hasSetTargets(exercise)) {
    if (isSet(exercise.sets) && exercise.sets !== exercise.setTargets.length) {
      return msg('plan_sets_count_mismatch');
    }
    for (const [index, target] of exercise.setTargets.entries()) {
      const error = validateTarget(target, index + 1);
      if (error) return error;
    }
    return null;
  }

  if (!isSet(exercise.sets) || exercise.sets < 1) {
    return msg('plan_exercise_needs_set');
  }
  return validateTarget(exercise, null);
}
