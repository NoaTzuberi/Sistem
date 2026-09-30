export const WORKOUT_CATEGORY_IDS = ['upper_body', 'push', 'pull', 'legs', 'full_body', 'core'] as const;
export type WorkoutCategory = (typeof WORKOUT_CATEGORY_IDS)[number];

export const WORKOUT_GOAL_IDS = ['strength', 'hypertrophy', 'endurance'] as const;
export type WorkoutGoal = (typeof WORKOUT_GOAL_IDS)[number];
