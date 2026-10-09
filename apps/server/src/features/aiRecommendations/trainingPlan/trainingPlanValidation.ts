import { translate } from '../../../i18n';
import type { PlanProblem } from '../../plans/plan.validation';
import { findCoachLibraryIds } from '../../exercises/exercise.service';
import { findPublishIssues, parseSavePlanPayload } from '../../plans/plan.validation';
import type { Candidate } from './trainingPlanCandidates';

// Checks a model reply in code. The draft must pass the SAME rules as a plan the coach
// saves and publishes in the dashboard (plan.validation.ts), plus a few AI-only rules.
// Every problem is a sentence that names the workout / exercise, so it can be sent back
// to the model on the next attempt.

const MAX_TEXT = 1000;
const UNKNOWN_EXERCISE = 'unknown';

/** Drops undefined keys: a Mixed field would store them as null. */
function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

export interface TrainingPlanValidationContext {
  candidates: Candidate[];
  trainingDays?: { min: number; max: number };
}

/** The stored output (real exercise ids; the coach-only "why" / "focus" kept). */
export interface StoredTrainingPlanExercise {
  exerciseId: string;
  sets: number;
  reps?: number;
  repsMax?: number;
  durationSec?: number;
  restSec?: number;
  supersetGroup?: string;
  why: string;
}

export interface StoredTrainingPlanWorkout {
  title: string;
  dayOfWeek?: number;
  focus: string;
  exercises: StoredTrainingPlanExercise[];
}

export interface StoredTrainingPlan {
  summary: string;
  split: string;
  considerations: string[];
  workouts: StoredTrainingPlanWorkout[];
}

export type TrainingPlanValidationResult = { value: StoredTrainingPlan; issues: [] } | { value: null; issues: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : '';
}

export async function validateTrainingPlanReply(
  reply: unknown,
  context: TrainingPlanValidationContext,
): Promise<TrainingPlanValidationResult> {
  if (!isRecord(reply) || !Array.isArray(reply.workouts)) {
    return { value: null, issues: ['The reply must be an object with a "workouts" list.'] };
  }

  const issues: string[] = [];
  const byAlias = new Map(context.candidates.map((candidate) => [candidate.alias, candidate]));
  const rawWorkouts = reply.workouts.filter(isRecord);
  const rawExercises = rawWorkouts.map((workout) => (Array.isArray(workout.exercises) ? workout.exercises.filter(isRecord) : []));

  const workoutLabel = (index: number) => {
    const title = text(rawWorkouts[index]?.title);
    return `Workout ${index + 1}${title ? ` ("${title}")` : ''}`;
  };
  const exerciseLabel = (workoutIndex: number, exerciseIndex: number) => {
    const entry = rawExercises[workoutIndex]?.[exerciseIndex];
    const alias = typeof entry?.exercise === 'string' ? entry.exercise : '?';
    const name = byAlias.get(alias)?.facts.name;
    return `${workoutLabel(workoutIndex)}, exercise ${exerciseIndex + 1} (${alias}${name ? ` ${name}` : ''})`;
  };
  // Sent back to the model: English.
  const describe = (issue: PlanProblem) => {
    const message = translate('en', issue);
    if (issue.workoutIndex === undefined) return message;
    if (issue.exerciseIndex === undefined) return `${workoutLabel(issue.workoutIndex)}: ${message}`;
    return `${exerciseLabel(issue.workoutIndex, issue.exerciseIndex)}: ${message}`;
  };

  // Aliases → real ids. The schema allows E001…E200; only this request's list counts.
  let hasUnknownAlias = false;
  const payloadWorkouts = rawWorkouts.map((workout, workoutIndex) => {
    return {
      title: workout.title,
      dayOfWeek: workout.dayOfWeek,
      exercises: rawExercises[workoutIndex].map((exercise, exerciseIndex) => {
        const candidate = typeof exercise.exercise === 'string' ? byAlias.get(exercise.exercise) : undefined;
        if (!candidate) {
          hasUnknownAlias = true;
          issues.push(`${exerciseLabel(workoutIndex, exerciseIndex)}: this alias is not in the candidate list.`);
        }
        return {
          exerciseId: candidate?.facts.id ?? UNKNOWN_EXERCISE,
          sets: exercise.sets,
          reps: exercise.reps,
          repsMax: exercise.repsMax,
          durationSec: exercise.durationSec,
          restSec: exercise.restSec,
          supersetGroup: exercise.supersetGroup,
        };
      }),
    };
  });
  // AI-only rules (checked on the reply as sent, so all problems go back in one round).
  const days = context.trainingDays;
  if (days && (payloadWorkouts.length < days.min || payloadWorkouts.length > days.max)) {
    const wanted = days.min === days.max ? `${days.min}` : `${days.min} to ${days.max}`;
    issues.push(`Plan ${wanted} workouts (her training days); the reply has ${payloadWorkouts.length}.`);
  }
  const seenDays = new Map<unknown, number>();
  payloadWorkouts.forEach((workout, workoutIndex) => {
    if (Number.isInteger(workout.dayOfWeek)) {
      const earlier = seenDays.get(workout.dayOfWeek);
      if (earlier !== undefined) {
        issues.push(`${workoutLabel(workoutIndex)}: day ${String(workout.dayOfWeek)} is already used by ${workoutLabel(earlier)}.`);
      } else seenDays.set(workout.dayOfWeek, workoutIndex);
    }
    const seenExercises = new Set<string>();
    workout.exercises.forEach((exercise, exerciseIndex) => {
      if (exercise.exerciseId === UNKNOWN_EXERCISE) return;
      if (seenExercises.has(exercise.exerciseId)) {
        issues.push(`${exerciseLabel(workoutIndex, exerciseIndex)}: the same exercise is already in this workout.`);
      }
      seenExercises.add(exercise.exerciseId);
    });
  });
  if (hasUnknownAlias) return { value: null, issues };

  // The dashboard's own rules: what a saved draft and a published plan must satisfy.
  const parsed = parseSavePlanPayload({ workouts: payloadWorkouts });
  if (!parsed.value) return { value: null, issues: [...parsed.issues.map(describe), ...issues] };
  const workouts = parsed.value.workouts;
  issues.push(...findPublishIssues(workouts).map(describe));

  // Still in the library now (an exercise could have been rejected since it was listed).
  const allIds = [...new Set(workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.exerciseId)))];
  const inLibrary = await findCoachLibraryIds(allIds);
  workouts.forEach((workout, workoutIndex) =>
    workout.exercises.forEach((exercise, exerciseIndex) => {
      if (!inLibrary.has(exercise.exerciseId)) {
        issues.push(`${exerciseLabel(workoutIndex, exerciseIndex)}: this exercise is no longer in the library.`);
      }
    }),
  );

  if (issues.length > 0) return { value: null, issues };

  return {
    value: {
      summary: text(reply.summary),
      split: text(reply.split),
      considerations: Array.isArray(reply.considerations) ? reply.considerations.map(text).filter(Boolean).slice(0, 12) : [],
      workouts: workouts.map((workout, workoutIndex) => compact({
        title: workout.title,
        dayOfWeek: workout.dayOfWeek,
        focus: text(rawWorkouts[workoutIndex].focus),
        exercises: workout.exercises.map((exercise, exerciseIndex) => {
          const raw = rawExercises[workoutIndex][exerciseIndex];
          return compact({
            exerciseId: exercise.exerciseId,
            sets: exercise.sets,
            reps: exercise.reps,
            repsMax: exercise.repsMax,
            durationSec: exercise.durationSec,
            restSec: exercise.restSec,
            supersetGroup: exercise.supersetGroup,
            why: text(raw.why),
          });
        }),
      })),
    },
    issues: [],
  };
}
