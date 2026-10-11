import type { PatternId } from '@sistem/types';

// Mirrors DIFFICULTY_IDS / PATTERN_IDS in apps/server/src/features/exercises/exercise.constants.ts
// (the family search rejects any other value).
export const DIFFICULTY_FILTERS = ['beginner', 'intermediate', 'advanced'] as const;

/** Mirrors PATTERN_IDS (exercise.constants.ts): the library's movement-pattern filter (Phase 12b). */
export const PATTERN_FILTERS = [
  'squat',
  'lunge',
  'hinge',
  'glute_bridge',
  'glute_isolation',
  'hip_abduction',
  'hip_adduction',
  'knee_flexion',
  'knee_extension',
  'calf_raise',
  'horizontal_push',
  'chest_fly',
  'vertical_push',
  'shoulder_raise',
  'rear_delt',
  'horizontal_pull',
  'vertical_pull',
  'shrug',
  'elbow_flexion',
  'elbow_extension',
  'forearm',
  'core',
  'carry',
  'power',
  'conditioning',
  'mobility',
] as const satisfies readonly PatternId[];
