import type {
  CalculationOverrideField,
  CalculationOverrides,
  CalorieSuggestion,
  CalorieSuggestionMissing,
  CalorieTimeline,
  FormulaSex,
  NutritionConfig,
  NutritionGoal,
  PortionCounts,
  TimelineLimit,
  TimelineNote,
} from '@sistem/types';
import { ageInYears } from '../aiRecommendations/trainingPlan/trainingPlanProfile';
import { daysBetween } from '../plans/planWeek';
import { MIFFLIN_SEX_CONSTANT, SUGGESTION_ROUND_TO_KCAL } from './nutrition.config';
import { PORTION_GROUP_IDS, PORTION_STEP, TARGET_REACHED_KG } from './nutrition.constants';

// The calorie calculation (PRD §5.6, the owner's method — Phase 13a+). Pure, so the
// builder and the AI nutrition draft (13c) compute it the same way. Never done by a model.
//   BMR (Mifflin-St Jeor) × activity factor (training days) = TDEE
//   → a daily deficit / surplus: her timeline (target weight + timeframe) or the goal %,
//     never above the safe maximum (% of body weight per week, % of TDEE, the floor)
//   → the recommended kcal (never below the floor) → portions per group.
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
  /** Her weight goal; `targetDate` = when her timeframe ends ('YYYY-MM-DD'), null = none. */
  weightGoal?: { targetWeightKg: number; targetDate: string | null } | null;
  /** Her today ('YYYY-MM-DD' in her zone) — timeframes count from here. */
  today: string;
}

export interface CalorieOptions {
  /** The coach's goal; unset = mapped from her onboarding goals. */
  goal?: NutritionGoal | null;
  /** The coach's formula pick — used only when her answer is not male / female. */
  formulaSex?: FormulaSex | null;
  /** The coach's own values in the calculation summary. */
  overrides?: Partial<CalculationOverrides> | null;
}

export const EMPTY_OVERRIDES: CalculationOverrides = {
  weightKg: null,
  heightCm: null,
  ageYears: null,
  activityFactor: null,
  targetWeightKg: null,
  timelineWeeks: null,
};

/**
 * Owner-approved mapping (onboarding goals stay unchanged): "lose weight" → fat loss;
 * "build muscle" without "lose weight" → muscle gain; anything else → toning / recomp.
 * Maintenance and aggressive fat loss are only ever the coach's choice.
 */
export function goalFromOnboarding(goals: readonly string[]): NutritionGoal {
  if (goals.includes('lose_weight')) return 'fat_loss';
  if (goals.includes('build_muscle')) return 'muscle_gain';
  return 'recomp';
}

/** Her "My goal" section is asked only for these onboarding goals (weight loss or gain). */
export function asksWeightGoal(goals: readonly string[]): boolean {
  return goals.includes('lose_weight') || goals.includes('build_muscle');
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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Which way her goal moves her weight (the timeline only applies to these). */
function goalDirection(goal: NutritionGoal): 'loss' | 'gain' | null {
  if (goal === 'fat_loss' || goal === 'fat_loss_aggressive') return 'loss';
  if (goal === 'muscle_gain') return 'gain';
  return null;
}

interface SafeLimit {
  /** kcal / day, positive. */
  kcal: number;
  limitedBy: TimelineLimit;
}

/**
 * The largest safe daily change. Loss: the smallest of the % of body weight per week,
 * the % of TDEE and what stays above the floor. Gain: the % of body weight per week.
 */
function safeDailyLimit(kind: 'loss' | 'gain', weightKg: number, tdee: number, config: NutritionConfig): SafeLimit {
  if (kind === 'gain') {
    return { kcal: (weightKg * config.maxGainRatePctPerWeek * config.kcalPerKg) / 100 / 7, limitedBy: 'rate' };
  }
  const limits: SafeLimit[] = [
    { kcal: (weightKg * config.maxLossRatePctPerWeek * config.kcalPerKg) / 100 / 7, limitedBy: 'rate' },
    { kcal: (tdee * config.maxDeficitPct) / 100, limitedBy: 'max_deficit' },
    { kcal: Math.max(0, tdee - config.floorKcal), limitedBy: 'floor' },
  ];
  return limits.reduce((lowest, limit) => (limit.kcal < lowest.kcal ? limit : lowest));
}

/**
 * Portions per group for a daily kcal: the coach's split ÷ the group values, in steps of
 * 0.5, then nudged half a portion at a time while that brings the total closer.
 */
export function recommendPortions(kcal: number, config: NutritionConfig): { portions: PortionCounts; kcal: number } {
  const portions = {} as PortionCounts;
  for (const group of PORTION_GROUP_IDS) {
    portions[group] = Math.max(0, roundTo((kcal * config.portionSplit[group]) / 100 / config.groupKcal[group], PORTION_STEP));
  }
  const total = () => PORTION_GROUP_IDS.reduce((sum, group) => sum + portions[group] * config.groupKcal[group], 0);
  for (let step = 0; step < 20; step += 1) {
    const gap = kcal - total();
    let best: { group: (typeof PORTION_GROUP_IDS)[number]; change: number; gap: number } | null = null;
    for (const group of PORTION_GROUP_IDS) {
      for (const change of [PORTION_STEP, -PORTION_STEP]) {
        if (portions[group] + change < 0) continue;
        const next = Math.abs(gap - change * config.groupKcal[group]);
        if (next < Math.abs(gap) && (!best || next < best.gap)) best = { group, change, gap: next };
      }
    }
    if (!best) break;
    portions[best.group] += best.change;
  }
  return { portions, kcal: Math.round(total()) };
}

export function suggestCalorieTarget(
  inputs: CalorieInputs,
  options: CalorieOptions,
  config: NutritionConfig,
  now: Date,
): CalorieSuggestion {
  const overrides = { ...EMPTY_OVERRIDES, ...(options.overrides ?? {}) };
  const overridden = (Object.keys(EMPTY_OVERRIDES) as CalculationOverrideField[]).filter((key) => overrides[key] !== null);

  const goal = options.goal ?? goalFromOnboarding(inputs.goals);
  const goalSource = options.goal ? 'coach' : 'onboarding';
  const adjustmentPct = config.goalAdjustments[goal];
  // Sex "other" or missing: no automatic estimate — the coach picks the constants or types the target.
  const formulaSex = formulaSexFromAnswer(inputs.gender) ?? options.formulaSex ?? null;
  const weightKg = overrides.weightKg ?? inputs.weight?.kg ?? null;
  const heightCm = overrides.heightCm ?? inputs.heightCm ?? null;
  const ageYears = overrides.ageYears ?? (inputs.birthDate ? ageInYears(inputs.birthDate, now) : null);
  const trainingDays = inputs.trainingFrequency ? trainingDaysFrom(inputs.trainingFrequency) : null;
  const activityFactor = overrides.activityFactor ?? (trainingDays !== null ? activityFactorFor(trainingDays, config) : null);

  // Her target and how many weeks are left (the coach's weeks count from today).
  const targetWeightKg = overrides.targetWeightKg ?? inputs.weightGoal?.targetWeightKg ?? null;
  const targetDate = overrides.timelineWeeks !== null ? null : (inputs.weightGoal?.targetDate ?? null);
  const timelineWeeks =
    overrides.timelineWeeks ?? (targetDate !== null ? round2(daysBetween(inputs.today, targetDate) / 7) : null);

  const missing: CalorieSuggestionMissing[] = [];
  if (weightKg === null) missing.push('weight');
  if (heightCm === null) missing.push('height');
  if (ageYears === null) missing.push('birthDate');
  if (activityFactor === null) missing.push('trainingFrequency');

  const base: CalorieSuggestion = {
    status: missing.length > 0 ? 'missing_inputs' : formulaSex ? 'ok' : 'needs_formula',
    missing,
    inputs: {
      weightKg,
      weightSource: overrides.weightKg !== null ? 'coach' : (inputs.weight?.source ?? null),
      weightDate: overrides.weightKg !== null ? null : (inputs.weight?.date ?? null),
      heightCm,
      ageYears,
      sex: inputs.gender || null,
      formulaSex,
      trainingDays,
      activityFactor,
      goal,
      goalSource,
      adjustmentPct,
      targetWeightKg,
      timelineWeeks,
      targetDate,
      overridden,
    },
    method: null,
    bmr: null,
    tdee: null,
    kcal: null,
    deltaKcal: null,
    deltaPct: null,
    weeklyRateKg: null,
    expectedWeeks: null,
    timeline: null,
    timelineNote: null,
    floorKcal: config.floorKcal,
    raisedToFloor: false,
    portions: null,
    portionsKcal: null,
  };
  if (base.status !== 'ok') return base;

  const bmr = mifflinBmr(weightKg!, heightCm!, ageYears!, formulaSex!);
  const tdee = bmr * activityFactor!;
  const direction = goalDirection(goal);

  // Is her target usable for this goal?
  let timelineNote: TimelineNote | null = null;
  let weightToChange: number | null = null;
  if (targetWeightKg !== null) {
    const diff = targetWeightKg - weightKg!;
    if (!direction) timelineNote = 'goal_not_weight';
    else if (Math.abs(diff) < TARGET_REACHED_KG) timelineNote = 'target_reached';
    else if ((direction === 'loss' && diff > 0) || (direction === 'gain' && diff < 0)) timelineNote = 'wrong_direction';
    else if (timelineWeeks !== null && timelineWeeks <= 0) {
      timelineNote = 'date_passed';
      weightToChange = Math.abs(diff);
    } else weightToChange = Math.abs(diff);
  }

  // The daily change: her pace when she gave one, else the goal %; never above the safe limit.
  let method: CalorieSuggestion['method'] = 'goal_percent';
  let timeline: CalorieTimeline | null = null;
  let delta = (tdee * adjustmentPct) / 100;
  if (delta !== 0) {
    const limit = safeDailyLimit(delta < 0 ? 'loss' : 'gain', weightKg!, tdee, config);
    delta = Math.sign(delta) * Math.min(Math.abs(delta), limit.kcal);
  }
  if (direction && weightToChange !== null && timelineNote === null && timelineWeeks !== null) {
    const limit = safeDailyLimit(direction, weightKg!, tdee, config);
    const required = (weightToChange * config.kcalPerKg) / (timelineWeeks * 7);
    const unsafe = required > limit.kcal + 0.5;
    const safeRateKg = (limit.kcal * 7) / config.kcalPerKg;
    method = 'timeline';
    delta = (direction === 'loss' ? -1 : 1) * Math.min(required, limit.kcal);
    timeline = {
      requestedWeeks: timelineWeeks,
      requiredDailyKcal: Math.round(required),
      requiredRateKg: round2((required * 7) / config.kcalPerKg),
      safeRateKg: round2(safeRateKg),
      unsafe,
      limitedBy: unsafe ? limit.limitedBy : null,
      recommendedWeeks: unsafe && safeRateKg > 0 ? Math.ceil(weightToChange / safeRateKg) : null,
    };
  }

  // The recommendation is never below the floor (raised and flagged — the coach can still
  // type a lower target with her explicit confirmation).
  let kcal = roundTo(tdee + delta, SUGGESTION_ROUND_TO_KCAL);
  const raisedToFloor = isBelowFloor(kcal, config);
  if (raisedToFloor) kcal = config.floorKcal;

  const deltaKcal = Math.round(kcal - tdee);
  const weeklyRateKg = round2((deltaKcal * 7) / config.kcalPerKg);
  const movesTowardTarget = weightToChange !== null && timelineNote !== 'wrong_direction' && Math.sign(weeklyRateKg) === (direction === 'loss' ? -1 : 1);
  const recommended = recommendPortions(kcal, config);
  return {
    ...base,
    method,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal,
    deltaKcal,
    deltaPct: Math.round((deltaKcal / tdee) * 1000) / 10,
    weeklyRateKg,
    expectedWeeks: movesTowardTarget && weeklyRateKg !== 0 ? Math.ceil(weightToChange! / Math.abs(weeklyRateKg)) : null,
    timeline,
    timelineNote,
    raisedToFloor,
    portions: recommended.portions,
    portionsKcal: recommended.kcal,
  };
}
