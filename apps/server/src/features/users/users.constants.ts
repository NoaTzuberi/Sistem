/**
 * Stable IDs for onboarding option sets, mirrored from
 * apps/mobile/src/features/onboarding/data/options.ts and activities.ts.
 * Kept in sync manually (onboarding lists stay untouched by owner decision).
 */

export const GOAL_IDS = [
  'build_muscle',
  'increase_strength',
  'lose_weight',
  'improve_endurance',
  'improve_health',
  'maintain_active_lifestyle',
  'move_better',
] as const;

export const ACTIVITY_IDS = [
  'gym_strength_training',
  'calisthenics',
  'functional_training',
  'crossfit',
  'running',
  'cycling',
  'swimming',
  'rowing',
  'hiking',
  'jump_rope',
  'yoga',
  'pilates',
  'mobility',
  'dance',
  'boxing',
  'martial_arts',
  'brazilian_jiu_jitsu',
  'muay_thai',
  'surfing',
  'skateboarding',
  'climbing',
  'skiing',
  'snowboarding',
  'football_soccer',
  'basketball',
  'tennis',
  'volleyball',
  'table_tennis',
  'badminton',
  'rugby',
  'other_activity',
] as const;

export const EQUIPMENT_IDS = [
  'full_gym',
  'home_equipment',
  'dumbbells',
  'barbell_plates',
  'resistance_bands',
  'bench',
  'cardio_machines',
  'bodyweight_only',
  'no_equipment',
] as const;

export const MUSCLE_FOCUS_IDS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'core',
  'glutes',
  'legs',
  'full_body',
] as const;

export const RECOVERY_FLAG_IDS = [
  'returning_after_break',
  'prefers_low_impact',
  'has_injury_or_limitation',
  'has_mobility_restrictions',
  'nothing_to_add',
] as const;

export const GENDER_IDS = ['male', 'female', 'other'] as const;

// Coach accounts are never created by public sign-up (PRD §3) — only promoted/seeded.
export const USER_ROLES = ['trainee', 'coach'] as const;
export const DEFAULT_USER_ROLE = 'trainee';
