import type { Types } from 'mongoose';
import type { SetType, WorkoutLogStatus } from '@sistem/types';

// Units: weight kg, durations seconds.
export interface WorkoutLogSetFields {
  exerciseId: Types.ObjectId;
  planExerciseId?: Types.ObjectId;
  setIndex: number;
  type?: SetType;
  reps?: number;
  weight?: number;
  durationSec?: number;
  completed: boolean;
  completedAt?: Date;
}

export interface WorkoutLogStatsFields {
  durationSec: number;
  totalVolume: number;
  setsCompleted: number;
  prCount: number;
}

export interface PrivatePhoto {
  // Cloudinary public id of an authenticated asset — delivered only via signed URLs.
  publicId: string;
  uploadedAt: Date;
}

export interface WorkoutLogDocument {
  traineeId: Types.ObjectId;
  planId: Types.ObjectId;
  workoutId: Types.ObjectId;
  workoutTitle: string;
  status: WorkoutLogStatus;
  startedAt: Date;
  finishedAt?: Date | null;
  sets: WorkoutLogSetFields[];
  stats?: WorkoutLogStatsFields;
  rating?: number;
  notes?: string;
  pumpPhoto?: PrivatePhoto;
  createdAt: Date;
  updatedAt: Date;
}
