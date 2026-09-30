import type { Types } from 'mongoose';
import type { Difficulty } from '../exercises/exercise.constants';
import type { WorkoutCategory, WorkoutGoal } from './workoutTemplate.constants';

export interface WorkoutTemplateExerciseEntry {
  exerciseId: Types.ObjectId;
  order: number;
  defaultSets: number;
  defaultReps: string;
  defaultWeight?: number;
  restTime?: number;
}

export interface WorkoutTemplateDocument {
  name: string;
  description?: string;
  goal: WorkoutGoal[];
  difficulty?: Difficulty;
  duration?: number;
  category?: WorkoutCategory;
  exercises: WorkoutTemplateExerciseEntry[];
  /** null = Sistem ready-made template; otherwise the owning user's id. */
  createdBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}
