import { Schema, Types, model } from 'mongoose';
import type { OnboardingStepId } from '@sistem/types';
import { ONBOARDING_STEP_IDS } from './onboarding.constants';

// The ATLAS User.profile shape, unchanged (onboarding is protected). Every field is
// optional while onboarding is in progress; completion runs the full validation.

interface TrainingFrequency {
  minDays: number;
  maxDays: number;
  flexibleSchedule: boolean;
}

interface ExercisePreferences {
  favoriteExerciseNotes?: string;
  improvementExerciseNotes?: string;
  muscleFocus: string[];
}

interface Recovery {
  flags: string[];
  notes?: string;
}

export interface OnboardingAnswersFields {
  birthDate?: Date;
  height?: number; // cm
  weight?: number; // kg
  gender?: string;
  goals: string[];
  trainingFrequency?: TrainingFrequency;
  preferredActivities: string[];
  exercisePreferences?: ExercisePreferences;
  equipment: string[];
  recovery?: Recovery;
}

export interface OnboardingResponseDocument {
  userId: Types.ObjectId;
  answers: OnboardingAnswersFields;
  lastStep?: OnboardingStepId | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const trainingFrequencySchema = new Schema<TrainingFrequency>(
  {
    minDays: { type: Number, min: 1, max: 7 },
    maxDays: { type: Number, min: 1, max: 7 },
    flexibleSchedule: { type: Boolean, default: false },
  },
  { _id: false },
);

const exercisePreferencesSchema = new Schema<ExercisePreferences>(
  {
    favoriteExerciseNotes: { type: String, trim: true },
    improvementExerciseNotes: { type: String, trim: true },
    muscleFocus: { type: [String], default: [] },
  },
  { _id: false },
);

const recoverySchema = new Schema<Recovery>(
  {
    flags: { type: [String], default: [] },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const answersSchema = new Schema<OnboardingAnswersFields>(
  {
    birthDate: { type: Date },
    height: { type: Number },
    weight: { type: Number },
    gender: { type: String, trim: true },
    goals: { type: [String], default: [] },
    trainingFrequency: { type: trainingFrequencySchema },
    preferredActivities: { type: [String], default: [] },
    exercisePreferences: { type: exercisePreferencesSchema },
    equipment: { type: [String], default: [] },
    recovery: { type: recoverySchema },
  },
  { _id: false },
);

const onboardingResponseSchema = new Schema<OnboardingResponseDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    answers: { type: answersSchema, required: true, default: () => ({}) },
    // Last step saved, so onboarding resumes on any device (Phase 4).
    lastStep: { type: String, enum: ONBOARDING_STEP_IDS, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const OnboardingResponse = model<OnboardingResponseDocument>('OnboardingResponse', onboardingResponseSchema);
