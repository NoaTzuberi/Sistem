import { Schema, Types, model } from 'mongoose';
import type { OnboardingStatus, UserRole } from '@sistem/types';
import {
  USER_ROLES,
  DEFAULT_USER_ROLE,
  ONBOARDING_STATUS_IDS,
  DEFAULT_ONBOARDING_STATUS,
  DEFAULT_TIMEZONE,
  PUSH_PLATFORM_IDS,
} from './users.constants';
import { isValidTimezone } from './timezone';

interface UserPreferences {
  units?: {
    weight?: 'kg' | 'lb';
    distance?: 'km' | 'miles';
  };
}

export interface PushToken {
  token: string;
  platform: (typeof PUSH_PLATFORM_IDS)[number];
  updatedAt: Date;
}

// Onboarding answers live in the OnboardingResponse collection (PRD §10), not here.
export interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
  preferences?: UserPreferences;
  onboardingStatus: OnboardingStatus;
  onboardingCompletedAt?: Date | null;
  /** Trainees only; null until a coach exists. Never assume a single coach in queries. */
  coachId?: Types.ObjectId | null;
  pushTokens: PushToken[];
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const preferencesSchema = new Schema<UserPreferences>(
  {
    units: {
      weight: { type: String, enum: ['kg', 'lb'] },
      distance: { type: String, enum: ['km', 'miles'] },
    },
  },
  { _id: false },
);

const pushTokenSchema = new Schema<PushToken>(
  {
    token: { type: String, required: true },
    platform: { type: String, enum: PUSH_PLATFORM_IDS, required: true },
    updatedAt: { type: Date, required: true, default: () => new Date() },
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
    preferences: { type: preferencesSchema },
    onboardingStatus: {
      type: String,
      enum: ONBOARDING_STATUS_IDS,
      default: DEFAULT_ONBOARDING_STATUS,
      required: true,
    },
    onboardingCompletedAt: { type: Date, default: null },
    coachId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Device tokens are never sent to clients.
    pushTokens: { type: [pushTokenSchema], default: [], select: false },
    timezone: {
      type: String,
      required: true,
      default: DEFAULT_TIMEZONE,
      validate: { validator: isValidTimezone, message: 'Invalid time zone.' },
    },
  },
  { timestamps: true },
);

userSchema.index({ coachId: 1, role: 1, createdAt: -1 });
// Phase 5b removes invalid/expired tokens by value.
userSchema.index({ 'pushTokens.token': 1 }, { sparse: true });

export const User = model<UserDocument>('User', userSchema);

export function isOnboardingCompleted(user: Pick<UserDocument, 'onboardingStatus'>): boolean {
  return user.onboardingStatus === 'completed';
}
