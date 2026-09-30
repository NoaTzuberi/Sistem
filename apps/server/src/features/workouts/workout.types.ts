import type { Types } from 'mongoose';
import type { WorkoutStatus } from './workout.constants';

export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutExerciseEntry {
  exerciseId: Types.ObjectId;
  sets: WorkoutSet[];
}

export interface WorkoutDocument {
  userId: Types.ObjectId;
  templateId: Types.ObjectId | null;
  name: string;
  date: Date;
  duration?: number;
  status: WorkoutStatus;
  exercises: WorkoutExerciseEntry[];
  totalVolume?: number;
  rating?: number;
  notes?: string;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
}
