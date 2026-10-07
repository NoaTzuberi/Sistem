import type { AiTrainingPlanDraft } from '@sistem/types';
import { newKey } from '../planBuilder/planDraft';
import type { DraftWorkout } from '../planBuilder/types';

/**
 * The AI draft as editable workouts — all new items (no ids). The coach-only "focus"
 * and "why" stay in the rationale panel: workout and exercise notes are what the
 * trainee sees, so they start empty for the coach to write.
 */
export function draftWorkoutsFromAi(draft: AiTrainingPlanDraft): DraftWorkout[] {
  return draft.workouts.map((workout) => ({
    key: newKey(),
    title: workout.title,
    dayOfWeek: workout.dayOfWeek,
    notes: '',
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
    })),
  }));
}
