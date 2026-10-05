// Moved here from the deleted ATLAS workouts feature (Phase 8). Nothing writes
// personal records since then; Phase 9 decides how PRs are computed from workout logs.
export const PERSONAL_RECORD_TYPE_IDS = ['weight', 'reps'] as const;
export type PersonalRecordType = (typeof PERSONAL_RECORD_TYPE_IDS)[number];
