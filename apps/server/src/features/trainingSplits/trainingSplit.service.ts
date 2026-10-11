import type {
  SplitConfig,
  TrainingConfig,
  TrainingSettingsPayload,
  TrainingSlot,
  WorkoutTypeConfig,
} from '@sistem/types';
import { DEFAULT_SPLITS, DEFAULT_WORKOUT_TYPES, MAX_TRAINING_DAYS } from './trainingSplit.config';
import { TrainingSettings } from './trainingSettings.model';

// The effective training config = defaults + the coach's overrides, and the small lookups every
// user of it needs (plan validation, the slot picker, the AI draft).

function cloneDefaults(): TrainingConfig {
  return {
    workoutTypes: DEFAULT_WORKOUT_TYPES.map((type) => ({ ...type, slots: type.slots.map((slot) => ({ ...slot, patterns: [...slot.patterns] })) })),
    splits: DEFAULT_SPLITS.map((split) => ({ ...split, days: Object.fromEntries(Object.entries(split.days).map(([days, types]) => [days, [...types]])) })),
  };
}

export function mergeTrainingConfig(overrides: TrainingSettingsPayload | null): TrainingConfig {
  const config = cloneDefaults();
  if (!overrides) return config;
  for (const type of config.workoutTypes) {
    const slots = overrides.workoutTypes?.[type.id]?.slots;
    if (slots && slots.length > 0) type.slots = slots.map((slot) => ({ ...slot, patterns: [...slot.patterns] }));
  }
  for (const split of config.splits) {
    const override = overrides.splits?.[split.id];
    if (!override) continue;
    if (typeof override.enabled === 'boolean') split.enabled = override.enabled;
    if (override.days && Object.keys(override.days).length > 0) split.days = override.days;
  }
  return config;
}

export async function getEffectiveTrainingConfig(coachId: string): Promise<TrainingConfig> {
  const settings = await TrainingSettings.findOne({ coachId }).lean();
  return mergeTrainingConfig(settings ? { workoutTypes: settings.workoutTypes, splits: settings.splits } : null);
}

export async function saveTrainingSettings(coachId: string, payload: TrainingSettingsPayload): Promise<TrainingConfig> {
  await TrainingSettings.findOneAndUpdate(
    { coachId },
    { $set: { workoutTypes: payload.workoutTypes ?? {}, splits: payload.splits ?? {} } },
    { upsert: true, new: true },
  );
  return getEffectiveTrainingConfig(coachId);
}

export function findWorkoutType(config: TrainingConfig, id: string): WorkoutTypeConfig | undefined {
  return config.workoutTypes.find((type) => type.id === id);
}

export function findSlot(config: TrainingConfig, workoutTypeId: string, slotId: string): TrainingSlot | undefined {
  return findWorkoutType(config, workoutTypeId)?.slots.find((slot) => slot.id === slotId);
}

export function findSplit(config: TrainingConfig, id: string): SplitConfig | undefined {
  return config.splits.find((split) => split.id === id);
}

/** The day counts a split is written for, ascending. */
export function splitDayCounts(split: SplitConfig): number[] {
  return Object.keys(split.days)
    .map(Number)
    .filter((days) => Number.isInteger(days) && days >= 1 && days <= MAX_TRAINING_DAYS)
    .sort((a, b) => a - b);
}

/** Her days range, with 7 capped to the max (one rest day). */
export function cappedDayRange(range: { min: number; max: number }): { min: number; max: number } {
  const max = Math.min(range.max, MAX_TRAINING_DAYS);
  return { min: Math.min(range.min, max), max };
}

/** Enabled splits with at least one day count inside her range, and those counts. */
export function splitsFitting(config: TrainingConfig, range: { min: number; max: number }): { split: SplitConfig; days: number[] }[] {
  const { min, max } = cappedDayRange(range);
  return config.splits
    .filter((split) => split.enabled)
    .map((split) => ({ split, days: splitDayCounts(split).filter((days) => days >= min && days <= max) }))
    .filter((entry) => entry.days.length > 0);
}

/** For a split the coach asked for: its day count nearest to her range (fewest days on a tie). */
export function nearestDayCount(split: SplitConfig, range: { min: number; max: number }): number | undefined {
  const { min, max } = cappedDayRange(range);
  const distance = (days: number) => (days < min ? min - days : days > max ? days - max : 0);
  return [...splitDayCounts(split)].sort((a, b) => distance(a) - distance(b) || a - b)[0];
}

export function workoutTypesForDays(split: SplitConfig, days: number): string[] {
  return split.days[String(days)] ?? [];
}

/** Does a family with these patterns fit the slot? */
export function patternsFitSlot(patterns: readonly string[], slot: TrainingSlot): boolean {
  return patterns.some((pattern) => (slot.patterns as string[]).includes(pattern));
}
