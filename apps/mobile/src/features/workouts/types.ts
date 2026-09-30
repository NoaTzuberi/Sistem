import type { Difficulty, ExerciseMediaFields } from '../exercises/types';

export type WorkoutCategory = 'upper_body' | 'push' | 'pull' | 'legs' | 'full_body' | 'core';
export type WorkoutGoal = 'strength' | 'hypertrophy' | 'endurance';

export interface WorkoutTemplateExerciseSummary {
  id: string;
  slug: string;
  name: string;
  primaryMuscles: string[];
  equipment: string[];
  media: ExerciseMediaFields;
}

export interface WorkoutTemplateExercise {
  order: number;
  defaultSets: number;
  defaultReps: string;
  defaultWeight?: number;
  restTime?: number;
  exercise: WorkoutTemplateExerciseSummary;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  goal: WorkoutGoal[];
  difficulty?: Difficulty;
  duration?: number;
  category?: WorkoutCategory;
  exercises: WorkoutTemplateExercise[];
  isSystemTemplate: boolean;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplateExerciseInput {
  exerciseId: string;
  order: number;
  defaultSets: number;
  defaultReps: string;
  defaultWeight?: number;
  restTime?: number;
}

export interface WorkoutTemplateInput {
  name: string;
  description?: string;
  goal?: WorkoutGoal[];
  difficulty?: Difficulty;
  duration?: number;
  category?: WorkoutCategory;
  exercises: WorkoutTemplateExerciseInput[];
}

export type WorkoutSessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutSessionExercise {
  exercise: WorkoutTemplateExerciseSummary;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  templateId: string | null;
  name: string;
  date: string;
  duration?: number;
  status: WorkoutSessionStatus;
  totalVolume?: number;
  rating?: number;
  notes?: string;
  photo?: string;
  exercises: WorkoutSessionExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSessionExerciseInput {
  exerciseId: string;
  sets: WorkoutSet[];
}

export type PersonalRecordType = 'weight' | 'reps';

export interface NewPersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: PersonalRecordType;
  previousValue: number;
  newValue: number;
}

export interface FinishWorkoutResult {
  workout: WorkoutSession;
  newPersonalRecords: NewPersonalRecord[];
}

export interface WorkoutSummary {
  id: string;
  templateId: string | null;
  name: string;
  date: string;
  status: WorkoutSessionStatus;
  duration?: number;
  totalVolume?: number;
  category?: WorkoutCategory;
}

/** The single most recent completed set logged for a specific exercise (by
 * id), used to suggest a starting point when adding it to a new workout. */
export interface LastLoggedExercise {
  sets: number;
  reps: number;
  weight: number;
  date: string;
}
