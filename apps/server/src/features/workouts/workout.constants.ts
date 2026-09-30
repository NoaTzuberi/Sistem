/**
 * 'in_progress' is additive to the originally documented 'completed | abandoned'
 * pair (docs/04_DATABASE_SCHEMA.md) — an active session must be persisted the
 * moment it starts (so a refresh or lost connection at the gym doesn't lose
 * logged sets), which needs a third state before a session resolves to either
 * terminal outcome.
 */
export const WORKOUT_STATUS_IDS = ['in_progress', 'completed', 'abandoned'] as const;
export type WorkoutStatus = (typeof WORKOUT_STATUS_IDS)[number];

export const PERSONAL_RECORD_TYPE_IDS = ['weight', 'reps'] as const;
export type PersonalRecordType = (typeof PERSONAL_RECORD_TYPE_IDS)[number];
