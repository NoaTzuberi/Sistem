import type { Types } from 'mongoose';
import type { PlanStatus, SetType } from '@sistem/types';

// Units: weights kg, durations and rest seconds.
export interface PlanSetTargetFields {
  type: SetType;
  reps?: number;
  repsMax?: number;
  durationSec?: number;
  targetWeight?: number;
  restSec?: number;
}

export interface PlanExerciseFields {
  exerciseId: Types.ObjectId;
  sets: number;
  reps?: number;
  repsMax?: number;
  durationSec?: number;
  targetWeight?: number;
  restSec?: number;
  notes?: string;
  supersetGroup?: string;
  setTargets?: PlanSetTargetFields[];
  /** Run hands-free as work / rest intervals (timed sets only). */
  interval?: boolean;
}

export interface PlanWorkoutFields {
  title: string;
  dayOfWeek?: number;
  order: number;
  notes?: string;
  exercises: (PlanExerciseFields & { _id: Types.ObjectId })[];
}

export interface PlanDocument {
  traineeId: Types.ObjectId;
  coachId: Types.ObjectId;
  weekStartDate: string;
  status: PlanStatus;
  publishedAt?: Date | null;
  notes?: string;
  workouts: (PlanWorkoutFields & { _id: Types.ObjectId })[];
  aiRecommendationId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}
