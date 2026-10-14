import type { PatternId } from '@sistem/types';

/**
 * The seven color groups of the movement patterns — THE one map (tokens --color-pattern-<group>,
 * classes .pattern-group-<group> in globals.css). The library uses it now; the plan builder can
 * reuse it. 'none' = a family without a pattern (a striped grey tile).
 */
export type PatternGroup = 'knee' | 'hip' | 'chest' | 'back' | 'shoulders' | 'core' | 'full' | 'none';

const GROUP_OF: Record<PatternId, Exclude<PatternGroup, 'none'>> = {
  // Legs — knee
  squat: 'knee',
  lunge: 'knee',
  knee_extension: 'knee',
  calf_raise: 'knee',
  // Legs — hip
  hinge: 'hip',
  glute_bridge: 'hip',
  glute_isolation: 'hip',
  hip_abduction: 'hip',
  hip_adduction: 'hip',
  knee_flexion: 'hip',
  // Chest
  horizontal_push: 'chest',
  chest_fly: 'chest',
  // Back (and the pulling arm muscles)
  horizontal_pull: 'back',
  vertical_pull: 'back',
  shrug: 'back',
  elbow_flexion: 'back',
  forearm: 'back',
  // Shoulders (and the pressing arm muscle)
  vertical_push: 'shoulders',
  shoulder_raise: 'shoulders',
  rear_delt: 'shoulders',
  elbow_extension: 'shoulders',
  // Core
  core: 'core',
  carry: 'core',
  // Whole body
  power: 'full',
  conditioning: 'full',
  mobility: 'full',
};

export function patternGroup(pattern: PatternId | undefined): PatternGroup {
  return pattern ? (GROUP_OF[pattern] ?? 'none') : 'none';
}

/** The class that sets --pattern-color / --pattern-soft for a pattern (the first one of a family). */
export function patternGroupClass(pattern: PatternId | undefined): string {
  return `pattern-group-${patternGroup(pattern)}`;
}

/** Two letters for a family's tile: the first letter of its first two words. */
export function familyInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0]?.toUpperCase() ?? '')
    .join('');
}
