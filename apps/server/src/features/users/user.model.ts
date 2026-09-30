import { Schema, model } from 'mongoose';
import type { UserRole } from '@sistem/types';
import { USER_ROLES, DEFAULT_USER_ROLE } from './users.constants';

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

interface UserProfile {
  birthDate?: Date;
  height?: number;
  weight?: number;
  gender?: string;
  goals: string[];
  trainingFrequency?: TrainingFrequency;
  preferredActivities: string[];
  exercisePreferences?: ExercisePreferences;
  equipment: string[];
  recovery?: Recovery;
}

interface UserPreferences {
  units?: {
    weight?: 'kg' | 'lb';
    distance?: 'km' | 'miles';
  };
}

export interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
  profile?: UserProfile;
  preferences?: UserPreferences;
  onboardingCompleted: boolean;
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

const profileSchema = new Schema<UserProfile>(
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

const preferencesSchema = new Schema<UserPreferences>(
  {
    units: {
      weight: { type: String, enum: ['kg', 'lb'] },
      distance: { type: String, enum: ['km', 'miles'] },
    },
  },
  { _id: false },
);

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: DEFAULT_USER_ROLE, required: true },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    profile: { type: profileSchema },
    preferences: { type: preferencesSchema },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const User = model<UserDocument>('User', userSchema);
