export type PersonalRecordType = 'weight' | 'reps';

export interface DashboardPersonalRecord {
  id: string;
  exercise: { id: string; slug: string; name: string };
  type: PersonalRecordType;
  previousValue: number;
  newValue: number;
  date: string;
}

export interface WeightTrendPoint {
  date: string;
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
