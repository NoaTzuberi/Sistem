import type { PatternId } from '@sistem/types';
import type { Equipment } from '../../exercises/exercise.constants';

// Tunables of the AI training-plan draft (Phase 12; exercise families and splits since 12b). The prompt lives in trainingPlanPrompt.ts.

/** Her free-text answers are cut to this many characters before they are sent. */
export const FREE_TEXT_MAX_LENGTH = 500;

/** Aliases F001…F200: a fixed list, so the alias part of the reply schema never changes. */
export const MAX_CANDIDATES = 200;
/** Fewer families than this after filtering: the model is not called and the coach is told why. */
export const MIN_CANDIDATES = 20;

/** Families offered per movement pattern a slot asks for: more for her focus muscles. */
export const CANDIDATES_PER_PATTERN = 6;
export const CANDIDATES_PER_FOCUS_PATTERN = 10;
/** Small patterns get half the share. */
export const MINOR_PATTERNS: PatternId[] = ['calf_raise', 'shrug', 'forearm', 'hip_adduction', 'knee_extension', 'carry'];
/** "Prefers low impact": no plyometric / Olympic families at all (checked in code, not only asked). */
export const LOW_IMPACT_EXCLUDED_PATTERNS: PatternId[] = ['power'];

/** Her onboarding muscle focus → the movement patterns that train it. */
export const MUSCLE_FOCUS_TO_PATTERNS: Record<string, PatternId[]> = {
  chest: ['horizontal_push', 'chest_fly'],
  back: ['horizontal_pull', 'vertical_pull', 'rear_delt'],
  shoulders: ['vertical_push', 'shoulder_raise', 'rear_delt'],
  arms: ['elbow_flexion', 'elbow_extension'],
  core: ['core'],
  glutes: ['glute_bridge', 'glute_isolation', 'hip_abduction', 'hinge'],
  legs: ['squat', 'lunge', 'hinge', 'knee_flexion', 'knee_extension', 'calf_raise'],
  full_body: [],
};

/** Her days when she gave none (Phase 12 planned 3 workouts then). */
export const DEFAULT_TRAINING_DAYS = { min: 3, max: 3 };

/** How many split options the model returns when several fit (PRD §8 v2: 2–3). */
export const MAX_SPLIT_OPTIONS = 3;

/** Training-knowledge passages (RAG) given to the model. */
export const KNOWLEDGE_TOP_K = 6;

/** Library equipment everybody has. */
export const ALWAYS_AVAILABLE_EQUIPMENT: Equipment[] = ['bodyweight', 'no_equipment'];

/**
 * Her onboarding equipment answer → the library equipment she can use. An exercise is
 * a candidate only when ALL of its equipment is in the union. 'bench' and
 * 'cardio_machines' add nothing: the library has no bench id, and its 'machine'
 * exercises are strength machines, not treadmills.
 */
export const ONBOARDING_EQUIPMENT_TO_LIBRARY: Record<string, Equipment[] | 'all'> = {
  full_gym: 'all',
  home_equipment: ['dumbbell', 'kettlebell', 'resistance_band', 'exercise_ball', 'medicine_ball', 'foam_roller'],
  dumbbells: ['dumbbell'],
  barbell_plates: ['barbell', 'ez_curl_bar'],
  resistance_bands: ['resistance_band'],
  bench: [],
  cardio_machines: [],
  bodyweight_only: [],
  no_equipment: [],
};

