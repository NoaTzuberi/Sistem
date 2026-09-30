import type { WorkoutExerciseRowValue } from '../components/WorkoutExerciseRow/WorkoutExerciseRow';

/** Only muscle groups that are actually visible on a front-view diagram.
 * Back/lats, glutes and hamstrings are real muscles the app tracks (they
 * still show up as chips in the workout summary via collectCoveredMuscles
 * below), but there is no honest front-facing shape to light up for them —
 * see the attribution comment in MuscleCoverageMap.tsx for why we don't fake
 * one with a relabeled front-view shape. */
export type BodyRegion = 'chest' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'abs' | 'quads' | 'calves';

export const BODY_REGIONS: BodyRegion[] = [
  'chest',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'quads',
  'calves',
];

export const BODY_REGION_LABELS: Record<BodyRegion, string> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  quads: 'Quads',
  calves: 'Calves',
};

/** Maps the app's exercise muscle IDs (see exercises/data/filterOptions.ts
 * MUSCLE_OPTIONS) onto the coarser regions the body diagram can actually
 * draw as distinct shapes. Neck/traps fold into shoulders; abductors/
 * adductors fold into quads — close enough for a legible small diagram.
 * Lats/middle_back/lower_back, glutes and hamstrings are deliberately
 * unmapped — not visible from the front, so they never light up a region
 * (muscleToRegion returns undefined and computeRegionCoverage skips them). */
const MUSCLE_TO_REGION: Record<string, BodyRegion> = {
  chest: 'chest',
  shoulders: 'shoulders',
  traps: 'shoulders',
  neck: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  abdominals: 'abs',
  quadriceps: 'quads',
  abductors: 'quads',
  adductors: 'quads',
  calves: 'calves',
};

export function muscleToRegion(muscle: string): BodyRegion | undefined {
  return MUSCLE_TO_REGION[muscle];
}

/** Counts how many added exercises target each region, via each exercise's
 * primary muscles. Used to scale highlight intensity on the coverage map. */
export function computeRegionCoverage(rows: WorkoutExerciseRowValue[]): Record<BodyRegion, number> {
  const counts = Object.fromEntries(BODY_REGIONS.map((region) => [region, 0])) as Record<BodyRegion, number>;

  for (const row of rows) {
    const regionsHitByThisExercise = new Set<BodyRegion>();
    for (const muscle of row.exercise.primaryMuscles) {
      const region = muscleToRegion(muscle);
      if (region) regionsHitByThisExercise.add(region);
    }
    for (const region of regionsHitByThisExercise) {
      counts[region] += 1;
    }
  }

  return counts;
}

/** Distinct muscle IDs across all added exercises, in first-seen order —
 * feeds the summary card's muscle-chip list. */
export function collectCoveredMuscles(rows: WorkoutExerciseRowValue[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    for (const muscle of row.exercise.primaryMuscles) {
      seen.add(muscle);
    }
  }
  return Array.from(seen);
}
