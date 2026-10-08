import type {
  CalorieSuggestion,
  CalorieSuggestionMissing,
  FormulaSex,
  NutritionConfig,
  NutritionGoal,
} from '@sistem/types';
import { ageInYears } from '../aiRecommendations/trainingPlan/trainingPlanProfile';
import { MIFFLIN_SEX_CONSTANT, SUGGESTION_ROUND_TO_KCAL } from './nutrition.config';

// The calorie target suggestion (PRD §5.6) — pure, so the builder (13a) and the AI
// nutrition draft (13c) compute it the same way. Never done by a model.
//   BMR (Mifflin-St Jeor) × activity factor (training days) = TDEE → goal adjustment %.
// Every number comes from the coach's effective config.

export interface CalorieWeight {
  kg: number;
  source: 'weigh_in' | 'onboarding';
  /** 'YYYY-MM-DD' of the weigh-in; null for the onboarding answer. */
  date: string | null;
}

/** What the estimate is made from: her latest weight and her onboarding answers. */
export interface CalorieInputs {
  weight: CalorieWeight | null;
  heightCm?: number;
  birthDate?: Date;
  gender?: string;
  trainingFrequency?: { minDays: number; maxDays: number };
  goals: string[];
}

export interface CalorieOptions {
  /** The coach's goal; unset = mapped from her onboarding goals. */
  goal?: NutritionGoal | null;
  /** The coach's formula pick — used only when her answer is not male / female. */
  formulaSex?: FormulaSex | null;
}

/**
 * Owner-approved mapping (onboarding goals stay unchanged): "lose weight" → fat loss;
 * "build muscle" without "lose weight" → muscle gain; anything else → toning / recomp.
 * Maintenance is only ever the coach's choice.
 */
export function goalFromOnboarding(goals: readonly string[]): NutritionGoal {
  if (goals.includes('lose_weight')) return 'fat_loss';
  if (goals.includes('build_muscle')) return 'muscle_gain';
  return 'recomp';
}

/** Her training days: the middle of her min–max answer, rounded half up (3–4 → 4). */
export function trainingDaysFrom(frequency: { minDays: number; maxDays: number }): number {
  return Math.min(7, Math.max(1, Math.round((frequency.minDays + frequency.maxDays) / 2)));
}

export function activityFactorFor(days: number, config: NutritionConfig): number {
  const factors = config.activityFactors;
  return factors[Math.min(factors.length, Math.max(1, days)) - 1];
}

/** Mifflin-St Jeor resting energy, kcal/day. */
export function mifflinBmr(weightKg: number, heightCm: number, ageYears: number, sex: FormulaSex): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + MIFFLIN_SEX_CONSTANT[sex];
}

export function isBelowFloor(kcal: number, config: NutritionConfig): boolean {
  return kcal < config.floorKcal;
}

function formulaSexFromAnswer(gender: string | undefined): FormulaSex | null {
  return gender === 'male' || gender === 'female' ? gender : null;
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function suggestCalorieTarget(
  inputs: CalorieInputs,
  options: CalorieOptions,
  config: NutritionConfig,
  now: Date,
): CalorieSuggestion {
  const goal = options.goal ?? goalFromOnboarding(inputs.goals);
  const goalSource = options.goal ? 'coach' : 'onboarding';
  const adjustmentPct = config.goalAdjustments[goal];
  // Sex "other" or missing: no automatic estimate — the coach picks the constants or types the target.
  const formulaSex = formulaSexFromAnswer(inputs.gender) ?? options.formulaSex ?? null;
  const ageYears = inputs.birthDate ? ageInYears(inputs.birthDate, now) : null;
  const trainingDays = inputs.trainingFrequency ? trainingDaysFrom(inputs.trainingFrequency) : null;
  const activityFactor = trainingDays !== null ? activityFactorFor(trainingDays, config) : null;

  const missing: CalorieSuggestionMissing[] = [];
  if (!inputs.weight) missing.push('weight');
  if (inputs.heightCm === undefined) missing.push('height');
  if (ageYears === null) missing.push('birthDate');
  if (activityFactor === null) missing.push('trainingFrequency');

  const base: CalorieSuggestion = {
    status: missing.length > 0 ? 'missing_inputs' : formulaSex ? 'ok' : 'needs_formula',
    missing,
    inputs: {
      weightKg: inputs.weight?.kg ?? null,
      weightSource: inputs.weight?.source ?? null,
      weightDate: inputs.weight?.date ?? null,
      heightCm: inputs.heightCm ?? null,
      ageYears,
      sex: inputs.gender || null,
      formulaSex,
      trainingDays,
      activityFactor,
      goal,
      goalSource,
      adjustmentPct,
    },
    bmr: null,
    tdee: null,
    kcal: null,
    floorKcal: config.floorKcal,
    belowFloor: false,
  };
  if (base.status !== 'ok') return base;

  const bmr = mifflinBmr(inputs.weight!.kg, inputs.heightCm!, ageYears!, formulaSex!);
  const tdee = bmr * activityFactor!;
  const kcal = roundTo(tdee * (1 + adjustmentPct / 100), SUGGESTION_ROUND_TO_KCAL);
  return {
    ...base,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal,
    belowFloor: isBelowFloor(kcal, config),
  };
}
