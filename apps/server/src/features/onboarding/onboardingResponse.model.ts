import { Schema, Types, model } from 'mongoose';
import type { NutritionPreferences, OnboardingStepId, TrainingExperience, WeightGoalTimeframe } from '@sistem/types';
import { TRAINING_EXPERIENCE_IDS } from '../users/users.constants';
import { ONBOARDING_STEP_IDS } from './onboarding.constants';
import {
  ALLERGY_IDS,
  DIET_STYLE_IDS,
  DIET_TYPE_IDS,
  INTOLERANCE_IDS,
  RELIGIOUS_IDS,
} from '../nutrition/nutrition.constants';

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
  /** Phase 13a (v2 in 13a+). Health data (allergies): same privacy as the other answers. */
  nutritionPreferences?: NutritionPreferences;
  /** Phase 13a+ ("My goal"). */
  weightGoal?: WeightGoalFields;
  /** Phase 12b (optional, on the frequency step). */
  trainingExperience?: TrainingExperience;
}

export interface WeightGoalFields {
  targetWeightKg: number;
  timeframe: WeightGoalTimeframe | null;
  setAt: Date;
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

function preferenceItemSchema(ids: readonly string[]) {
  return new Schema(
    {
      id: { type: String, enum: ids, required: true },
      details: { type: String, trim: true },
    },
    { _id: false },
  );
}

const nutritionPreferencesSchema = new Schema<NutritionPreferences>(
  {
    dietType: { type: String, enum: DIET_TYPE_IDS, required: true },
    dietTypeDetails: { type: String, trim: true },
    dietStyles: { type: [preferenceItemSchema(DIET_STYLE_IDS)], default: [] },
    religious: { type: [preferenceItemSchema(RELIGIOUS_IDS)], default: [] },
    intolerances: { type: [preferenceItemSchema(INTOLERANCE_IDS)], default: [] },
    allergies: { type: [preferenceItemSchema(ALLERGY_IDS)], default: [] },
    foodsLoved: { type: String, trim: true },
    foodsDisliked: { type: String, trim: true },
    mealsPerDay: { type: Number, min: 2, max: 6, default: null },
  },
  { _id: false },
);

const weightGoalSchema = new Schema<WeightGoalFields>(
  {
    targetWeightKg: { type: Number, required: true },
    // { kind: 'weeks', weeks } | { kind: 'date', date } — checked by the validator.
    timeframe: { type: Schema.Types.Mixed, default: null },
    setAt: { type: Date, required: true },
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
    nutritionPreferences: { type: nutritionPreferencesSchema },
    weightGoal: { type: weightGoalSchema },
    trainingExperience: { type: String, enum: TRAINING_EXPERIENCE_IDS },
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
