import type { AiTrainingPlanDraft, Language, TrainingConfig } from '@sistem/types';
import { splitWorkoutTitles, splitWorkoutTypes } from '@sistem/shared';
import { newKey } from '../planBuilder/planDraft';
import type { DraftWorkout } from '../planBuilder/types';

/**
 * The AI draft as editable workouts — all new items (no ids). The coach-only "focus"
 * and "why" stay in the rationale panel: workout and exercise notes are what the
 * trainee sees, so they start empty for the coach to write. Phase 12b drafts also carry
 * each workout's type and each exercise's slot.
 */
export function draftWorkoutsFromAi(draft: AiTrainingPlanDraft): DraftWorkout[] {
  return draft.workouts.map((workout) => ({
    key: newKey(),
    title: workout.title,
    dayOfWeek: workout.dayOfWeek,
    notes: '',
    workoutType: workout.workoutType ?? undefined,
    exercises: workout.exercises.map((exercise) => ({
      key: newKey(),
      exerciseId: exercise.exerciseId,
      facts: exercise.exercise,
      // `?? undefined`: a missing number must never arrive as null (the editor reads undefined).
      mode: exercise.durationSec != null && exercise.reps == null ? 'time' : 'reps',
      sets: exercise.sets,
      reps: exercise.reps ?? undefined,
      repsMax: exercise.repsMax ?? undefined,
      durationSec: exercise.durationSec ?? undefined,
      restSec: exercise.restSec ?? undefined,
      notes: '',
      supersetGroup: exercise.supersetGroup ?? '',
      setTargets: null,
      interval: false,
      slotId: exercise.slotId ?? undefined,
    })),
  }));
}

/**
 * "Use split only" (Phase 12b): one empty workout per day of the split, typed, with the slot template
 * ready. When the AI planned this same split and day count, its days of the week are kept (and its
 * picks show as suggestions in the slots — see PlanEditor).
 */
export function draftWorkoutsFromSplit(
  config: TrainingConfig,
  splitId: string,
  daysPerWeek: number,
  language: Language,
  aiDraft?: AiTrainingPlanDraft | null,
): DraftWorkout[] {
  const types = splitWorkoutTypes(config.splits.find((split) => split.id === splitId), daysPerWeek);
  const titles = splitWorkoutTitles(types, config, language);
  const sameSplit = aiDraft?.splitId === splitId && aiDraft.workouts.length === types.length;
  return types.map((workoutType, index) => ({
    key: newKey(),
    title: titles[index],
    dayOfWeek: sameSplit ? aiDraft.workouts[index].dayOfWeek ?? undefined : undefined,
    notes: '',
    workoutType,
    exercises: [],
  }));
}
