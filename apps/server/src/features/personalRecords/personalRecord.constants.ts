// Phase 9: the PR record. Written only when a workout is finished
// (personalRecord.service recordPersonalRecords); read by /api/personal-records, the
// Profile stats, each log's PR lines, and Phase 11's "new personal record" achievement.
//   weight   — heaviest weight ever on the exercise (rep sets)
//   reps     — most reps ever at a weight she has lifted before (or bodyweight)
//   duration — longest hold ever at a weight (or none); interval sets don't count
export const PERSONAL_RECORD_TYPE_IDS = ['weight', 'reps', 'duration'] as const;
export type PersonalRecordType = (typeof PERSONAL_RECORD_TYPE_IDS)[number];
