import type { TrainingExperience } from '@sistem/types';
import { DIFFICULTY_IDS, EQUIPMENT_IDS, type Difficulty, type Equipment } from '../exercises/exercise.constants';
import { OnboardingResponse } from '../onboarding/onboardingResponse.model';
import { ALWAYS_AVAILABLE_EQUIPMENT, ONBOARDING_EQUIPMENT_TO_LIBRARY } from '../aiRecommendations/trainingPlan/trainingPlan.constants';

// What a trainee can do, from her onboarding answers: the library equipment she has and the
// levels offered. One place for the slot picker and the AI draft (Phase 12b).

/**
 * The library has only 13 'advanced' exercises (Kaggle "Expert") and marks nearly everything else
 * intermediate, so beginner-only would leave too little: new and some → beginner + intermediate,
 * experienced → all. No answer → as Phase 12 (beginner + intermediate).
 */
export function levelsForExperience(experience: TrainingExperience | undefined): Difficulty[] {
  return experience === 'experienced' ? [...DIFFICULTY_IDS] : ['beginner', 'intermediate'];
}

/** Her onboarding equipment answer → the library equipment she can use (bodyweight always). */
export function equipmentForAnswers(answers: readonly string[]): Set<Equipment> {
  const allowed = new Set<Equipment>(ALWAYS_AVAILABLE_EQUIPMENT);
  for (const answer of answers) {
    const mapped = ONBOARDING_EQUIPMENT_TO_LIBRARY[answer];
    if (mapped === 'all') return new Set(EQUIPMENT_IDS);
    mapped?.forEach((equipment) => allowed.add(equipment));
  }
  return allowed;
}

export interface TraineeExerciseAccess {
  equipment: Set<Equipment>;
  levels: Difficulty[];
}

export async function loadTraineeExerciseAccess(traineeId: string): Promise<TraineeExerciseAccess> {
  const response = await OnboardingResponse.findOne({ userId: traineeId }).select('answers.equipment answers.trainingExperience').lean();
  return {
    equipment: equipmentForAnswers(response?.answers?.equipment ?? []),
    levels: levelsForExperience(response?.answers?.trainingExperience),
  };
}

/** An exercise fits her when ALL its equipment is hers and its level is offered. */
export function exerciseAllowed(exercise: { equipment: string[]; difficulty: string }, access: TraineeExerciseAccess): boolean {
  return (
    exercise.equipment.every((item) => access.equipment.has(item as Equipment)) && access.levels.includes(exercise.difficulty as Difficulty)
  );
}
