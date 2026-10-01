// Mirrors MUSCLE_IDS / EQUIPMENT_IDS / DIFFICULTY_IDS in
// apps/server/src/features/exercises/exercise.constants.ts (the search endpoint
// rejects any other value).
export const MUSCLE_FILTERS = [
  'abdominals',
  'abductors',
  'adductors',
  'biceps',
  'calves',
  'chest',
  'forearms',
  'glutes',
  'hamstrings',
  'lats',
  'lower_back',
  'middle_back',
  'neck',
  'quadriceps',
  'shoulders',
  'traps',
  'triceps',
] as const;

export const EQUIPMENT_FILTERS = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'kettlebell',
  'resistance_band',
  'bodyweight',
  'ez_curl_bar',
  'exercise_ball',
  'foam_roller',
  'medicine_ball',
  'no_equipment',
  'other',
] as const;

export const DIFFICULTY_FILTERS = ['beginner', 'intermediate', 'advanced'] as const;
