import type { NutritionConfig, NutritionGoal, NutritionSettingsPayload, PortionGroup } from '@sistem/types';
import { PORTION_GROUPS } from '@sistem/shared';

// The settings screen's form: the coach's numbers as typed (an emptied field is undefined until she
// types again), checked against the server's ranges so a bad value is marked where it is. The server
// checks again on save — these are the same numbers as its NUTRITION_SETTING_BOUNDS.
export const SETTING_BOUNDS = {
  groupKcal: { min: 10, max: 1000 },
  goalAdjustmentPct: { min: -40, max: 40 },
  activityFactor: { min: 1, max: 2.5 },
  floorKcal: { min: 800, max: 2500 },
  kcalPerKg: { min: 5000, max: 9000 },
  lossRatePct: { min: 0.1, max: 2 },
  gainRatePct: { min: 0.1, max: 1 },
  maxDeficitPct: { min: 5, max: 40 },
  portionSplitPct: { min: 0, max: 100 },
  ketoMaxCarbPortions: { min: 0, max: 10 },
} as const;

/** The design's steppers: ±10 kcal a portion, ±1 goal %, ±50 kcal floor, ±1 split %, ±0.5 keto portions. */
export const STEPS = { groupKcal: 10, goalPct: 1, floorKcal: 50, activityFactor: 0.025, portionSplitPct: 1, ketoMaxCarbPortions: 0.5 } as const;

export const GOALS: readonly NutritionGoal[] = ['fat_loss', 'fat_loss_aggressive', 'recomp', 'muscle_gain', 'maintenance'];

/** Card 5's pace and safety tiles, each with its tint (blue = losing, pink = gaining, amber = the deficit cap). */
export const SAFETY_FIELDS = [
  { key: 'maxLossRatePctPerWeek', step: 0.1, bounds: SETTING_BOUNDS.lossRatePct, tone: 'loss' },
  { key: 'maxGainRatePctPerWeek', step: 0.1, bounds: SETTING_BOUNDS.gainRatePct, tone: 'gain' },
  { key: 'maxDeficitPct', step: 1, bounds: SETTING_BOUNDS.maxDeficitPct, tone: 'deficit' },
  { key: 'kcalPerKg', step: 100, bounds: SETTING_BOUNDS.kcalPerKg, tone: 'neutral' },
] as const;

type Value = number | undefined;

export interface SettingsForm {
  groupKcal: Record<PortionGroup, Value>;
  goalAdjustments: Record<NutritionGoal, Value>;
  activityFactors: Value[];
  floorKcal: Value;
  kcalPerKg: Value;
  maxLossRatePctPerWeek: Value;
  maxGainRatePctPerWeek: Value;
  maxDeficitPct: Value;
  portionSplit: Record<PortionGroup, Value>;
  ketoMaxCarbPortions: Value;
}

export function toForm(config: NutritionConfig): SettingsForm {
  return {
    groupKcal: { protein: config.groupKcal.protein, carb: config.groupKcal.carb, fat: config.groupKcal.fat, snack: config.groupKcal.snack },
    goalAdjustments: { ...config.goalAdjustments },
    activityFactors: [...config.activityFactors],
    floorKcal: config.floorKcal,
    kcalPerKg: config.kcalPerKg,
    maxLossRatePctPerWeek: config.maxLossRatePctPerWeek,
    maxGainRatePctPerWeek: config.maxGainRatePctPerWeek,
    maxDeficitPct: config.maxDeficitPct,
    portionSplit: { ...config.portionSplit },
    ketoMaxCarbPortions: config.ketoMaxCarbPortions,
  };
}

/** What a marked field says: out of range, not whole, empty, or (the split) not adding up to 100. */
export type FieldError =
  | { kind: 'range' | 'whole'; min: number; max: number }
  | { kind: 'required' }
  | { kind: 'splitSum'; sum: number };

/** Field path ('groupKcal.protein', 'activityFactors.2', 'floorKcal', 'portionSplit') → its error. */
export type SettingsErrors = Partial<Record<string, FieldError>>;

function check(errors: SettingsErrors, path: string, value: Value, bounds: { min: number; max: number }, whole = false) {
  if (value === undefined || Number.isNaN(value)) errors[path] = { kind: 'required' };
  else if (value < bounds.min || value > bounds.max || (whole && !Number.isInteger(value))) {
    errors[path] = { kind: whole ? 'whole' : 'range', ...bounds };
  }
}

export function validateSettings(form: SettingsForm): SettingsErrors {
  const errors: SettingsErrors = {};
  for (const group of PORTION_GROUPS) check(errors, `groupKcal.${group}`, form.groupKcal[group], SETTING_BOUNDS.groupKcal);
  for (const goal of GOALS) check(errors, `goalAdjustments.${goal}`, form.goalAdjustments[goal], SETTING_BOUNDS.goalAdjustmentPct);
  form.activityFactors.forEach((factor, index) => check(errors, `activityFactors.${index}`, factor, SETTING_BOUNDS.activityFactor));
  check(errors, 'floorKcal', form.floorKcal, SETTING_BOUNDS.floorKcal, true);
  for (const { key, bounds } of SAFETY_FIELDS) check(errors, key, form[key], bounds);
  check(errors, 'ketoMaxCarbPortions', form.ketoMaxCarbPortions, SETTING_BOUNDS.ketoMaxCarbPortions);
  for (const group of PORTION_GROUPS) check(errors, `portionSplit.${group}`, form.portionSplit[group], SETTING_BOUNDS.portionSplitPct);
  const shares = PORTION_GROUPS.map((group) => form.portionSplit[group]);
  if (shares.every((share) => share !== undefined)) {
    const sum = shares.reduce<number>((total, share) => total + (share ?? 0), 0);
    if (Math.abs(sum - 100) > 0.01) errors.portionSplit = { kind: 'splitSum', sum: Math.round(sum * 100) / 100 };
  }
  return errors;
}

/** The split as typed, an empty share counted as 0 — what the bar and the sum pill show while she types. */
export function splitTotal(form: SettingsForm): number {
  const sum = PORTION_GROUPS.reduce<number>((total, group) => total + (form.portionSplit[group] ?? 0), 0);
  return Math.round(sum * 100) / 100;
}

/** The payload, or undefined while anything is marked. */
export function toPayload(form: SettingsForm, errors: SettingsErrors): NutritionSettingsPayload | undefined {
  if (Object.keys(errors).length > 0) return undefined;
  return form as NutritionSettingsPayload;
}

export function sameSettings(a: SettingsForm, b: SettingsForm): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** A stepper's next value: one step, kept inside the bounds and free of float dust (1.55 + 0.025). */
export function stepValue(value: Value, step: number, bounds: { min: number; max: number }): number {
  const next = Math.round(((value ?? 0) + step) * 1000) / 1000;
  return Math.min(bounds.max, Math.max(bounds.min, next));
}
