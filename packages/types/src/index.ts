// API contract types shared by the mobile app, the coach dashboard and the server.
// Types only — no runtime code, so the server (CommonJS) can use `import type`.

export type UserRole = 'trainee' | 'coach';

/**
 * Where a signed-in user belongs, decided by the server (PRD §4.2).
 * 'onboarding' → questionnaire, 'waiting' → plan is being built, 'home' → trainee
 * Home, 'coach' → coach mode.
 */
export type AppState = 'onboarding' | 'waiting' | 'home' | 'coach';

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  appState: AppState;
  onboardingStatus: OnboardingStatus;
  /** Computed from onboardingStatus — kept so older screens keep working. */
  onboardingCompleted: boolean;
  /** Server time; the 48h waiting timer counts from here (PRD §4.1). */
  onboardingCompletedAt: string | null;
  /** IANA time zone, e.g. 'Asia/Jerusalem'. Weeks start on Sunday in this zone. */
  timezone: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  /** Device time zone (IANA). An unknown value falls back to the server default. */
  timezone?: string;
}

export interface ApiErrorBody {
  message: string;
}

// ---------------------------------------------------------------------------
// Onboarding (PRD §10 OnboardingResponse)
// ---------------------------------------------------------------------------

export type OnboardingStepId =
  | 'welcome'
  | 'basic_profile'
  | 'goals'
  | 'frequency'
  | 'activities'
  | 'exercise_preferences'
  | 'recovery'
  | 'equipment'
  | 'review';

export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'km' | 'miles';

/** The questionnaire answers — the same shape ATLAS stored in User.profile. */
export interface OnboardingAnswers {
  birthDate?: string;
  /** cm */
  height?: number;
  /** kg */
  weight?: number;
  gender?: string;
  goals: string[];
  trainingFrequency?: { minDays: number; maxDays: number; flexibleSchedule: boolean };
  preferredActivities: string[];
  exercisePreferences?: {
    favoriteExerciseNotes?: string;
    improvementExerciseNotes?: string;
    muscleFocus: string[];
  };
  equipment: string[];
  recovery?: { flags: string[]; notes?: string };
}

/**
 * Body of PATCH /onboarding (one step) and POST /onboarding/complete (every field).
 * `name` goes to User.name and `units` to User.preferences.units; the rest are answers.
 */
export interface OnboardingAnswersPayload {
  name?: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  gender?: string;
  units?: { weight: WeightUnit; distance: DistanceUnit };
  goals?: string[];
  trainingFrequency?: { minDays: number; maxDays: number; flexibleSchedule: boolean };
  preferredActivities?: string[];
  exercisePreferences?: {
    favoriteExerciseNotes?: string;
    improvementExerciseNotes?: string;
    muscleFocus?: string[];
  };
  equipment?: string[];
  recovery?: { flags?: string[]; notes?: string };
}

export interface SaveOnboardingStepPayload {
  step: OnboardingStepId;
  answers: OnboardingAnswersPayload;
}

export interface MyOnboarding {
  status: OnboardingStatus;
  lastStep: OnboardingStepId | null;
  completedAt: string | null;
  name: string;
  units: { weight?: WeightUnit; distance?: DistanceUnit } | null;
  answers: OnboardingAnswers | null;
}

export interface OnboardingSaveResponse {
  user: AuthUser;
  onboarding: MyOnboarding;
}

// ---------------------------------------------------------------------------
// Plans (PRD §10). All weights are kg, all body measurements cm, durations seconds.
// ---------------------------------------------------------------------------

export type PlanStatus = 'draft' | 'published';
export type SetType = 'warmup' | 'working' | 'drop';

/** One set as the coach planned it (pyramids, drop sets, warm-ups). */
export interface PlanSetTarget {
  type: SetType;
  reps?: number;
  repsMax?: number;
  durationSec?: number;
  targetWeight?: number;
  restSec?: number;
}

/**
 * A concrete set, resolved on the server from either setTargets or the uniform
 * fields. Screens always read this list — they never re-derive sets themselves.
 */
export interface ResolvedPlanSet extends PlanSetTarget {
  /** 0-based */
  setIndex: number;
}

export interface PlanExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps?: number;
  repsMax?: number;
  durationSec?: number;
  targetWeight?: number;
  restSec?: number;
  notes?: string;
  /** Exercises sharing a group inside a workout are done back to back. */
  supersetGroup?: string;
  setTargets?: PlanSetTarget[];
  resolvedSets: ResolvedPlanSet[];
}

export interface PlanWorkout {
  id: string;
  title: string;
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek?: number;
  order: number;
  notes?: string;
  exercises: PlanExercise[];
}

export interface Plan {
  id: string;
  traineeId: string;
  coachId: string;
  /** 'YYYY-MM-DD', always a Sunday in the trainee's time zone. */
  weekStartDate: string;
  status: PlanStatus;
  publishedAt: string | null;
  notes?: string;
  workouts: PlanWorkout[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Workout logs, body metrics, achievements
// ---------------------------------------------------------------------------

export type WorkoutLogStatus = 'in_progress' | 'completed' | 'abandoned';

export interface WorkoutLogSet {
  exerciseId: string;
  planExerciseId?: string;
  setIndex: number;
  type?: SetType;
  reps?: number;
  /** kg */
  weight?: number;
  durationSec?: number;
  completed: boolean;
  completedAt?: string;
}

export interface WorkoutLogStats {
  durationSec: number;
  totalVolume: number;
  setsCompleted: number;
  prCount: number;
}

export interface WorkoutLog {
  id: string;
  traineeId: string;
  planId: string;
  workoutId: string;
  workoutTitle: string;
  status: WorkoutLogStatus;
  startedAt: string;
  finishedAt: string | null;
  sets: WorkoutLogSet[];
  stats: WorkoutLogStats | null;
  rating?: number;
  notes?: string;
  /** Photos are private: the file is served only through signed URLs (Phase 9). */
  pumpPhoto: { uploadedAt: string } | null;
}

export type ProgressPhotoPose = 'front' | 'side' | 'back';

export interface BodyMetric {
  id: string;
  traineeId: string;
  /** 'YYYY-MM-DD' in the trainee's time zone */
  date: string;
  /** kg */
  weight?: number;
  /** cm, keyed by measurement id (chest, waist, hips, arms, thighs) */
  measurements: Record<string, number>;
  photos: { pose: ProgressPhotoPose; uploadedAt: string }[];
  notes?: string;
}

export interface Achievement {
  id: string;
  traineeId: string;
  type: string;
  value?: number;
  unlockedAt: string;
  sourceLogId: string | null;
  sourceBodyMetricId: string | null;
}

// ---------------------------------------------------------------------------
// Coach views
// ---------------------------------------------------------------------------

export interface CoachTraineeSummary {
  id: string;
  name: string;
  email: string;
  onboardingStatus: OnboardingStatus;
  onboardingCompletedAt: string | null;
  timezone: string;
  createdAt: string;
}

export interface CoachTraineeDetail extends CoachTraineeSummary {
  onboarding: MyOnboarding | null;
}
