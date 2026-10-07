// Phase 9: the PR record. Written only when a workout is finished
// (personalRecord.service savePersonalRecords); read by each log's PR lines and the
// Phase 11 achievements (first weight / reps PR, PR count milestones).
//   weight   — heaviest weight ever on the exercise (rep sets)
//   reps     — most reps ever at a weight she has lifted before (or bodyweight)
//   duration — longest hold ever at a weight (or none); interval sets don't count
// A new kind (e.g. cardio distance / pace, Phase 14) is one more id here plus its
// detection; achievements pick it up through a metric (achievementMetrics.ts).
export const PERSONAL_RECORD_TYPE_IDS = ['weight', 'reps', 'duration'] as const;
export type PersonalRecordType = (typeof PERSONAL_RECORD_TYPE_IDS)[number];
