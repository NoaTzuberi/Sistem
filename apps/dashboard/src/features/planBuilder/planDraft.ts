import type { CoachPlan, ExerciseFacts, PlanExerciseInput, SavePlanPayload, SetType } from '@sistem/types';
import type { DraftExercise, DraftKeys, DraftSetTarget, DraftTargets, DraftWorkout, PlanDraft } from './types';
import { DEFAULT_REPS, DEFAULT_SETS } from './data/planDefaults';

// Pure functions over the editable plan. No rule about what a valid plan is lives
// here — the server decides that and answers with issues.

export function newKey(): string {
  return crypto.randomUUID();
}

export function draftFromPlan(plan: CoachPlan): PlanDraft {
  return {
    notes: plan.notes ?? '',
    workouts: plan.workouts.map((workout) => ({
      key: newKey(),
      id: workout.id,
      title: workout.title,
      dayOfWeek: workout.dayOfWeek,
      notes: workout.notes ?? '',
      exercises: workout.exercises.map((exercise) => ({
        key: newKey(),
        id: exercise.id,
        exerciseId: exercise.exerciseId,
        facts: exercise.exercise,
        mode: exercise.durationSec !== undefined && exercise.reps === undefined ? 'time' : 'reps',
        sets: exercise.sets,
        reps: exercise.reps,
        repsMax: exercise.repsMax,
        durationSec: exercise.durationSec,
        targetWeight: exercise.targetWeight,
        restSec: exercise.restSec,
        notes: exercise.notes ?? '',
        supersetGroup: exercise.supersetGroup ?? '',
        setTargets: exercise.setTargets?.map((target) => ({ key: newKey(), ...target })) ?? null,
      })),
    })),
  };
}

function exerciseToInput(exercise: DraftExercise): PlanExerciseInput {
  const common = {
    id: exercise.id,
    exerciseId: exercise.exerciseId,
    notes: exercise.notes.trim() || undefined,
    supersetGroup: exercise.supersetGroup || undefined,
  };

  if (exercise.setTargets) {
    return {
      ...common,
      setTargets: exercise.setTargets.map(({ type, reps, repsMax, durationSec, targetWeight, restSec }) => ({
        type,
        reps,
        repsMax,
        durationSec,
        targetWeight,
        restSec,
      })),
    };
  }

  return {
    ...common,
    sets: exercise.sets,
    // Simple mode counts reps or seconds, never both.
    reps: exercise.mode === 'reps' ? exercise.reps : undefined,
    repsMax: exercise.mode === 'reps' ? exercise.repsMax : undefined,
    durationSec: exercise.mode === 'time' ? exercise.durationSec : undefined,
    targetWeight: exercise.targetWeight,
    restSec: exercise.restSec,
  };
}

export function toPayload(draft: PlanDraft): SavePlanPayload {
  return {
    notes: draft.notes.trim() || undefined,
    workouts: draft.workouts.map((workout) => ({
      id: workout.id,
      title: workout.title,
      dayOfWeek: workout.dayOfWeek,
      notes: workout.notes.trim() || undefined,
      exercises: workout.exercises.map(exerciseToInput),
    })),
  };
}

export function keysOf(draft: PlanDraft): DraftKeys {
  return draft.workouts.map((workout) => ({ key: workout.key, exercises: workout.exercises.map((exercise) => exercise.key) }));
}

/**
 * Gives new items the ids the server stored for them. `sentKeys` is the draft as it
 * was sent (the response has the same order), so this also works on a draft that was
 * edited while the save was on its way.
 */
export function assignSavedIds(draft: PlanDraft, sentKeys: DraftKeys, saved: CoachPlan): PlanDraft {
  const ids = new Map<string, string>();
  sentKeys.forEach((sentWorkout, workoutIndex) => {
    const savedWorkout = saved.workouts[workoutIndex];
    if (!savedWorkout) return;
    ids.set(sentWorkout.key, savedWorkout.id);
    sentWorkout.exercises.forEach((exerciseKey, exerciseIndex) => {
      const savedExercise = savedWorkout.exercises[exerciseIndex];
      if (savedExercise) ids.set(exerciseKey, savedExercise.id);
    });
  });

  return {
    ...draft,
    workouts: draft.workouts.map((workout) => ({
      ...workout,
      id: ids.get(workout.key) ?? workout.id,
      exercises: workout.exercises.map((exercise) => ({ ...exercise, id: ids.get(exercise.key) ?? exercise.id })),
    })),
  };
}

export function newWorkout(position: number): DraftWorkout {
  // A placeholder title she is expected to rename (a workout cannot be saved without one).
  return { key: newKey(), title: `Workout ${position}`, notes: '', exercises: [] };
}

export function newExercise(facts: ExerciseFacts): DraftExercise {
  return {
    key: newKey(),
    exerciseId: facts.id,
    facts,
    mode: 'reps',
    sets: DEFAULT_SETS,
    reps: DEFAULT_REPS,
    notes: '',
    supersetGroup: '',
    setTargets: null,
  };
}

/** A copy that the server will store as new items (no ids). */
export function duplicateWorkout(workout: DraftWorkout): DraftWorkout {
  return {
    ...workout,
    key: newKey(),
    id: undefined,
    exercises: workout.exercises.map((exercise) => ({
      ...exercise,
      key: newKey(),
      id: undefined,
      setTargets: exercise.setTargets?.map((target) => ({ ...target, key: newKey() })) ?? null,
    })),
  };
}

function targetsOf(source: DraftTargets): DraftTargets {
  const { reps, repsMax, durationSec, targetWeight, restSec } = source;
  return { reps, repsMax, durationSec, targetWeight, restSec };
}

export function newSetTarget(type: SetType, copyFrom?: DraftTargets): DraftSetTarget {
  return { key: newKey(), type, ...(copyFrom ? targetsOf(copyFrom) : {}) };
}

/** Simple → per-set: one working row per set, pre-filled with the simple values. */
export function toPerSetTargets(exercise: DraftExercise): DraftSetTarget[] {
  const simple: DraftTargets = {
    reps: exercise.mode === 'reps' ? exercise.reps : undefined,
    repsMax: exercise.mode === 'reps' ? exercise.repsMax : undefined,
    durationSec: exercise.mode === 'time' ? exercise.durationSec : undefined,
    targetWeight: exercise.targetWeight,
    restSec: exercise.restSec,
  };
  return Array.from({ length: Math.max(1, exercise.sets ?? 1) }, () => newSetTarget('working', simple));
}

/**
 * Per-set → simple: the per-set values are dropped; the first working set (or the
 * first set) becomes the value for every set.
 */
export function toSimpleTargets(exercise: DraftExercise): DraftExercise {
  const targets = exercise.setTargets ?? [];
  const base = targets.find((target) => target.type === 'working') ?? targets[0];
  if (!base) return { ...exercise, setTargets: null };
  return {
    ...exercise,
    ...targetsOf(base),
    mode: base.durationSec !== undefined && base.reps === undefined ? 'time' : 'reps',
    sets: targets.length,
    setTargets: null,
  };
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * A hint while editing (the server enforces this on publish): a superset label used
 * by one exercise only, or by exercises that are not next to each other.
 */
export function supersetWarnings(exercises: DraftExercise[]): Map<string, string> {
  const positions = new Map<string, number[]>();
  exercises.forEach((exercise, index) => {
    if (!exercise.supersetGroup) return;
    positions.set(exercise.supersetGroup, [...(positions.get(exercise.supersetGroup) ?? []), index]);
  });

  const warnings = new Map<string, string>();
  for (const [group, indexes] of positions) {
    if (indexes.length < 2) {
      warnings.set(exercises[indexes[0]].key, `Superset ${group} needs at least two exercises.`);
      continue;
    }
    indexes.forEach((position, i) => {
      if (i > 0 && position !== indexes[i - 1] + 1) {
        warnings.set(exercises[position].key, `Superset ${group} exercises must be next to each other.`);
      }
    });
  }
  return warnings;
}
