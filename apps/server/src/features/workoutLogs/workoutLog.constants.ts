// Same states as the ATLAS session: a log is saved the moment a workout starts,
// so a closed app or lost connection never loses logged sets.
export const WORKOUT_LOG_STATUS_IDS = ['in_progress', 'completed', 'abandoned'] as const;
export const DEFAULT_WORKOUT_LOG_STATUS = 'in_progress';

export const MIN_RATING = 1;
export const MAX_RATING = 5;
