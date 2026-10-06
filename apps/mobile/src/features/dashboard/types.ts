export type PersonalRecordType = 'weight' | 'reps' | 'duration';

export interface DashboardPersonalRecord {
  id: string;
  exercise: { id: string; slug: string; name: string };
  type: PersonalRecordType;
  previousValue: number;
  newValue: number;
  date: string;
}

export interface WeightTrendPoint {
  /** 'YYYY-MM-DD' */
  date: string;
  /** kg */
  weight: number;
}

export interface DashboardSummary {
  streak: number;
  totalWorkouts: number;
  workoutsLast7Days: number;
  recentPersonalRecords: DashboardPersonalRecord[];
  weightTrend: WeightTrendPoint[];
  latestWeight?: number;
  weightChange?: number;
}
