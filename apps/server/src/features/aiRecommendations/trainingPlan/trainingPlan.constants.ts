import type { Difficulty, Equipment, Muscle } from '../../exercises/exercise.constants';

// Tunables of the AI training-plan draft (Phase 12). The prompt lives in trainingPlanPrompt.ts.

/** Her free-text answers are cut to this many characters before they are sent. */
export const FREE_TEXT_MAX_LENGTH = 500;

/**
 * Owner decision: onboarding has no experience question yet, so 'advanced' exercises
 * are never offered (PRD §14 backlog: an experience-level question).
 */
export const CANDIDATE_DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate'];

/** Aliases E001…E200: a fixed list, so the reply schema is the same for every request. */
export const MAX_CANDIDATES = 200;
/** Fewer than this after filtering: the model is not called and the coach is told why. */
export const MIN_CANDIDATES = 20;

/** Strength exercises offered per muscle: more for the muscles she wants to focus on. */
export const CANDIDATES_PER_MUSCLE = 6;
export const CANDIDATES_PER_FOCUS_MUSCLE = 12;
/** Small muscles get half the share (the big lifts already train them). */
export const MINOR_MUSCLES: Muscle[] = ['abductors', 'adductors', 'forearms', 'traps', 'calves'];
export const MOBILITY_CANDIDATES = 10;
export const CARDIO_CANDIDATES = 8;

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

/** Her onboarding muscle focus → library muscles that get the larger share. */
export const MUSCLE_FOCUS_TO_MUSCLES: Record<string, Muscle[]> = {
  chest: ['chest'],
  back: ['lats', 'middle_back', 'lower_back', 'traps'],
  shoulders: ['shoulders'],
  arms: ['biceps', 'triceps', 'forearms'],
  core: ['abdominals', 'lower_back'],
  glutes: ['glutes', 'abductors', 'adductors'],
  legs: ['quadriceps', 'hamstrings', 'calves', 'glutes'],
  full_body: [],
};

/** Muscles never offered on their own. */
export const EXCLUDED_MUSCLES: Muscle[] = ['neck'];

/** Goals / recovery flags that add mobility or cardio exercises to the candidates. */
export const MOBILITY_TRIGGERS = ['move_better', 'has_mobility_restrictions', 'prefers_low_impact'];
export const CARDIO_TRIGGERS = ['improve_endurance', 'lose_weight'];
