import type { SetType } from '@sistem/types';
import type { PersonalRecordType } from './personalRecord.constants';

// PR detection (Phase 9) — pure, so every rule is tested without a database.
// Only completed WORKING sets count, on both sides: warm-ups and drop sets would create
// noisy PRs (a drop set's many reps at a light weight). The first time she does an
// exercise (or a weight, for reps / holds) is her baseline, never a PR.

export interface PrSet {
  exerciseId: string;
  planExerciseId?: string;
  type?: SetType;
  reps?: number;
  weight?: number;
  durationSec?: number;
  completed: boolean;
}

export interface DetectedPersonalRecord {
  exerciseId: string;
  type: PersonalRecordType;
  newValue: number;
  previousValue: number;
  /** The weight a reps / duration PR was done at; absent = bodyweight / none. */
  weight?: number;
}

function isWorking(set: PrSet): boolean {
  return set.completed && (set.type === undefined || set.type === 'working');
}

function isRepSet(set: PrSet): boolean {
  return set.reps !== undefined && set.reps >= 1;
}

function isHoldSet(set: PrSet): boolean {
  return set.reps === undefined && set.durationSec !== undefined && set.durationSec >= 1;
}

/** No weight and 0 kg are the same: bodyweight. */
function weightKey(set: PrSet): number {
  return set.weight ?? 0;
}

/** Best value per weight. */
function bestByWeight(sets: PrSet[], value: (set: PrSet) => number): Map<number, number> {
  const best = new Map<number, number>();
  for (const set of sets) {
    const key = weightKey(set);
    best.set(key, Math.max(best.get(key) ?? 0, value(set)));
  }
  return best;
}

/**
 * The best "more at the same weight" improvement: only weights she has done before
 * (a new weight is a baseline); the heaviest weight wins, then the biggest value.
 */
function improvementAtKnownWeight(
  current: PrSet[],
  history: PrSet[],
  value: (set: PrSet) => number,
): { weight: number; newValue: number; previousValue: number } | null {
  const previous = bestByWeight(history, value);
  let found: { weight: number; newValue: number; previousValue: number } | null = null;
  for (const [weight, newValue] of bestByWeight(current, value)) {
    const previousValue = previous.get(weight);
    if (previousValue === undefined || newValue <= previousValue) continue;
    if (!found || weight > found.weight || (weight === found.weight && newValue > found.newValue)) {
      found = { weight, newValue, previousValue };
    }
  }
  return found;
}

function detectForExercise(
  exerciseId: string,
  current: PrSet[],
  history: PrSet[],
): DetectedPersonalRecord | null {
  const currentReps = current.filter(isRepSet);
  const historyReps = history.filter(isRepSet);

  // 1. Heaviest weight ever (rep sets only — a weighted hold is not a lift).
  const currentWeights = currentReps.map(weightKey).filter((weight) => weight > 0);
  const historyWeights = historyReps.map(weightKey).filter((weight) => weight > 0);
  if (currentWeights.length > 0 && historyWeights.length > 0) {
    const newValue = Math.max(...currentWeights);
    const previousValue = Math.max(...historyWeights);
    if (newValue > previousValue) return { exerciseId, type: 'weight', newValue, previousValue };
  }

  // 2. Most reps at a weight she has lifted before.
  const reps = improvementAtKnownWeight(currentReps, historyReps, (set) => set.reps ?? 0);
  if (reps) {
    return { exerciseId, type: 'reps', newValue: reps.newValue, previousValue: reps.previousValue, ...(reps.weight > 0 && { weight: reps.weight }) };
  }

  // 3. Longest hold at the same weight (or none).
  const hold = improvementAtKnownWeight(current.filter(isHoldSet), history.filter(isHoldSet), (set) => set.durationSec ?? 0);
  if (hold) {
    return { exerciseId, type: 'duration', newValue: hold.newValue, previousValue: hold.previousValue, ...(hold.weight > 0 && { weight: hold.weight }) };
  }
  return null;
}

/**
 * At most one PR per exercise (weight → reps → duration), in the order the exercises
 * appear in the workout. `intervalPlanExerciseIds`: interval sets in this workout run
 * on the coach's clock, so they never count as a longer hold.
 */
export function detectPersonalRecords(
  currentSets: PrSet[],
  historySets: PrSet[],
  intervalPlanExerciseIds: ReadonlySet<string> = new Set(),
): DetectedPersonalRecord[] {
  const current = currentSets.filter(
    (set) => isWorking(set) && !(isHoldSet(set) && set.planExerciseId && intervalPlanExerciseIds.has(set.planExerciseId)),
  );
  const history = historySets.filter(isWorking);
  const exerciseIds = [...new Set(current.map((set) => set.exerciseId))];

  return exerciseIds.flatMap((exerciseId) => {
    const found = detectForExercise(
      exerciseId,
      current.filter((set) => set.exerciseId === exerciseId),
      history.filter((set) => set.exerciseId === exerciseId),
    );
    return found ? [found] : [];
  });
}
