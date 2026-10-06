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

/**
 * GET /onboarding/waiting — what the "plan is being built" screen polls.
 * Both times come from the server clock; the client never uses device time for
 * the countdown (PRD §4.1, §11).
 */
export interface WaitingStatus {
  /** Changes to 'home' once a plan is published. */
  appState: AppState;
  serverTime: string;
  /** onboardingCompletedAt + the 48h window; null if onboarding is not finished. */
  planDueAt: string | null;
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

/**
 * The factual library fields of an exercise — all the coach and the trainee ever see
 * from the imported dataset (no descriptions, tips or ratings: not cleared for use).
 */
export interface ExerciseFacts {
  id: string;
  name: string;
  primaryMuscles: string[];
  equipment: string[];
  difficulty: string;
  movementType: string;
}

export interface PlanExercise {
  id: string;
  exerciseId: string;
  /** The library facts (name, …); missing only if the exercise left the library. */
  exercise?: ExerciseFacts;
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
  /**
   * Interval mode (HIIT / Tabata): every set is timed — durationSec = work, restSec =
   * rest, one set = one round. A superset is interval as a whole (a circuit) or not at all.
   */
  interval?: boolean;
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
// The trainee's own plans (/api/plans) — Phase 7
// ---------------------------------------------------------------------------

/**
 * Computed on the server in the trainee's time zone (clients never derive it):
 * done — a completed workout log exists · missed — not done and its day has passed
 * (a workout without a day: once its week is over) · upcoming — everything else.
 */
export type WorkoutStatus = 'upcoming' | 'done' | 'missed';

export interface TraineePlanWorkout extends PlanWorkout {
  status: WorkoutStatus;
  /** 'YYYY-MM-DD' of the planned day; null when the coach set no day. */
  date: string | null;
  /** Planned for today (in the trainee's time zone). */
  isToday: boolean;
  /** An unfinished workout log is open for it. */
  inProgress: boolean;
  /** The completed log of a done workout. */
  logId: string | null;
}

/** Where a plan's week sits relative to the trainee's current week. */
export type PlanPeriod = 'past' | 'current' | 'upcoming';

export interface TraineePlan extends Plan {
  period: PlanPeriod;
  workouts: TraineePlanWorkout[];
}

/** GET /plans — the trainee's published plans, newest week first. */
export interface TraineePlanList {
  items: TraineePlan[];
  /** Today's date in the trainee's time zone. */
  today: string;
  /** The Sunday that starts next week, so the app can pick next week's plan without date math. */
  nextWeekStartDate: string;
  serverTime: string;
}

/** GET /plans/week — what Home shows. */
export interface TraineeWeek {
  /** The Sunday of the current week in the trainee's time zone. */
  weekStartDate: string;
  today: string;
  serverTime: string;
  /** null when no plan is published for this week. */
  plan: TraineePlan | null;
  /**
   * What "Start next workout" opens: the workout in progress, else the first upcoming
   * one, else the earliest missed one (still doable until the week ends), else null.
   */
  nextWorkoutId: string | null;
  /** Her open workout session, if any — also one left open in an earlier week. */
  activeLog: ActiveWorkoutRef | null;
}

// ---------------------------------------------------------------------------
// Plan builder (coach, /api/coach) — Phase 6
// ---------------------------------------------------------------------------

/** A plan as the coach sees it. */
export interface CoachPlan extends Plan {
  /**
   * True once the trainee has a workout log for this plan: it can still be edited,
   * but no longer unpublished or deleted.
   */
  locked: boolean;
}

export interface PlanExerciseInput {
  /** Send the id of an existing plan exercise to keep it (workout logs point at it). */
  id?: string;
  exerciseId: string;
  /** Ignored when setTargets is sent (the set count is its length). */
  sets?: number;
  reps?: number;
  repsMax?: number;
  durationSec?: number;
  targetWeight?: number;
  restSec?: number;
  notes?: string;
  supersetGroup?: string;
  setTargets?: PlanSetTarget[];
  /** Timed sets only; a superset must be all interval or none to publish. */
  interval?: boolean;
}

export interface PlanWorkoutInput {
  /** Send the id of an existing workout to keep it (workout logs point at it). */
  id?: string;
  title: string;
  dayOfWeek?: number;
  notes?: string;
  exercises: PlanExerciseInput[];
}

/** Body of PUT …/plans/:planId — the whole plan; order is the array order. */
export interface SavePlanPayload {
  notes?: string;
  workouts: PlanWorkoutInput[];
}

/** Body of POST …/plans. */
export interface CreatePlanPayload {
  /** 'YYYY-MM-DD' Sunday, this week or later in the trainee's time zone. */
  weekStartDate: string;
  /** Start from a copy of the trainee's most recent earlier plan instead of empty. */
  duplicatePrevious?: boolean;
}

/** How a week sits relative to the trainee's current week (her time zone). */
export type PlanWeekRelation = 'this' | 'next' | 'later';

/** One week the coach can pick for a new plan — never a past week. */
export interface PlanWeekOption {
  /** 'YYYY-MM-DD', a Sunday in the trainee's time zone. */
  weekStartDate: string;
  relation: PlanWeekRelation;
  /** The plan already in this week (draft or published): open it instead of creating. */
  plan: { id: string; status: PlanStatus } | null;
  /** The week "Duplicate last week" would copy into this one; null when there is none. */
  copiesFromWeek: string | null;
}

/** GET …/plan-weeks — the week picker of "New plan" and "Duplicate last week". */
export interface PlanWeekOptions {
  currentWeekStart: string;
  weeks: PlanWeekOption[];
  /** Always this week (it may already have a plan — then the picker offers "Open"). */
  defaultNewWeek: string;
  /** This week, or next week when this week already has a plan. */
  defaultDuplicateWeek: string;
}

/** One problem in a plan, pointing at the workout / exercise it belongs to (0-based). */
export interface PlanIssue {
  message: string;
  workoutIndex?: number;
  exerciseIndex?: number;
}

/** 400 body of the plan save / publish endpoints. */
export interface PlanIssuesBody extends ApiErrorBody {
  issues: PlanIssue[];
}

export interface ExerciseSearchParams {
  search?: string;
  muscle?: string;
  equipment?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}

export interface ExerciseSearchResult {
  items: ExerciseFacts[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
  /** 1–5, "How was it?" (PRD §5.3). */
  rating?: number;
  notes?: string;
  pumpPhoto: PrivatePhoto | null;
  /** Facts of the exercises in `sets` — filled in by the read endpoints (trainee + coach). */
  exercises?: ExerciseFacts[];
  /** PRs hit in this workout, in workout order — filled in by the read endpoints. */
  personalRecords?: LogPersonalRecord[];
}

/**
 * A private photo (Daily Pump, later progress photos). The file is never public: `url`
 * is a short-lived signed link made for the signed-in viewer (the trainee or her
 * coach) on each request. When it expires, fetch the log again for a fresh one.
 */
export interface PrivatePhoto {
  uploadedAt: string;
  url: string;
  urlExpiresAt: string;
}

/**
 * weight = heaviest ever (kg) · reps = most reps at a weight done before · duration =
 * longest hold (seconds) at a weight. Working sets only; the first time is a baseline.
 */
export type PersonalRecordType = 'weight' | 'reps' | 'duration';

export interface LogPersonalRecord {
  exerciseId: string;
  type: PersonalRecordType;
  newValue: number;
  previousValue: number;
  /** kg — the weight a reps / duration record was done at; absent = bodyweight / none. */
  weight?: number;
}

/** Body of PATCH /workout-logs/:id/summary. null clears a value; a missing key leaves it. */
export interface WorkoutSummaryPayload {
  rating?: number | null;
  notes?: string | null;
}

// ---------------------------------------------------------------------------
// Active workout session (/api/workout-logs) — Phase 8, PRD §5.2
// ---------------------------------------------------------------------------

/** Enough to point at an open session (Home's "Resume", the start conflict). */
export interface ActiveWorkoutRef {
  logId: string;
  planId: string;
  workoutId: string;
  workoutTitle: string;
  startedAt: string;
}

/** Her most recent completed performance of one exercise ("Last time: 40 kg × 10"). */
export interface LastPerformance {
  reps?: number;
  /** kg */
  weight?: number;
  durationSec?: number;
  finishedAt: string;
}

/**
 * Everything the session screen needs. The log's sets were pre-filled by the server
 * from resolvedSets when the workout started; `workout` is the planned workout (facts,
 * targets, coach notes) the sets are matched to by planExerciseId + setIndex.
 */
export interface WorkoutSession {
  log: WorkoutLog;
  workout: PlanWorkout;
  /** Keyed by exerciseId; only exercises she has done before. */
  lastPerformance: Record<string, LastPerformance>;
  serverTime: string;
}

/** Body of POST /workout-logs — start, or resume the same workout. */
export interface StartWorkoutPayload {
  planId: string;
  workoutId: string;
}

/** 409 body when another workout is still open: resume it or discard it first. */
export interface ActiveWorkoutConflictBody extends ApiErrorBody {
  code: 'other_workout_active';
  activeLog: ActiveWorkoutRef;
}

/** One set as the trainee logged it. null clears a value (e.g. no weight). */
export interface WorkoutLogSetUpdate {
  planExerciseId: string;
  setIndex: number;
  reps?: number | null;
  /** kg */
  weight?: number | null;
  durationSec?: number | null;
  completed: boolean;
}

/** Body of PATCH /workout-logs/:id/sets, and the optional body of …/finish. */
export interface UpdateWorkoutSetsPayload {
  sets: WorkoutLogSetUpdate[];
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

/**
 * new: onboarding not finished · waiting: onboarding finished, no published plan yet ·
 * active: a published plan for this week or later · inactive: only older published plans.
 */
export type TraineeStatus = 'new' | 'waiting' | 'active' | 'inactive';

export interface CoachTraineeSummary {
  id: string;
  name: string;
  email: string;
  onboardingStatus: OnboardingStatus;
  onboardingCompletedAt: string | null;
  timezone: string;
  createdAt: string;
  status: TraineeStatus;
  /** End of the 48h window; set only while the trainee is waiting for her first plan. */
  planDueAt: string | null;
  /** Active, with no plan (draft or published) for next week yet. */
  needsNextWeekPlan: boolean;
  /** Start of her latest workout log. */
  lastActivityAt: string | null;
  /** 'YYYY-MM-DD' Sunday of the current week in the trainee's time zone. */
  currentWeekStart: string;
}

export interface CoachTraineeDetail extends CoachTraineeSummary {
  onboarding: MyOnboarding | null;
}

/** GET /coach/trainees. serverTime is the clock the 48h countdowns count against. */
export interface CoachTraineeList {
  items: CoachTraineeSummary[];
  serverTime: string;
}

/** GET /coach/trainees/:traineeId */
export interface CoachTraineeResponse {
  trainee: CoachTraineeDetail;
  serverTime: string;
}

// ---------------------------------------------------------------------------
// Notifications (PRD §9). In-app since Phase 5a; push is added on top in Phase 5b.
// No wording is stored: screens build the text and the tap target from type + data.
// ---------------------------------------------------------------------------

export type NotificationType = 'trainee_onboarded' | 'plan_published' | 'workout_completed';

interface NotificationBase {
  id: string;
  createdAt: string;
  /** null = unread */
  readAt: string | null;
}

export type AppNotification =
  /** To the coach. traineeName is a snapshot from when the trainee finished onboarding. */
  | (NotificationBase & { type: 'trainee_onboarded'; data: { traineeId: string; traineeName: string } })
  /** To the trainee. */
  | (NotificationBase & { type: 'plan_published'; data: { planId: string; weekStartDate: string } })
  /** To the coach (Phase 8). Names are snapshots from when the workout was finished. */
  | (NotificationBase & {
      type: 'workout_completed';
      data: { traineeId: string; traineeName: string; logId: string; workoutTitle: string };
    });

/** GET /notifications — newest first. */
export interface NotificationList {
  items: AppNotification[];
  /** All of the user's unread notifications, not only this page. */
  unreadCount: number;
  /** Pass as `before` to get the next page; null when there is no more. */
  nextCursor: string | null;
}

export interface NotificationListParams {
  /** 1–50, default 20 */
  limit?: number;
  before?: string;
  /** true = unread only */
  unread?: boolean;
}
