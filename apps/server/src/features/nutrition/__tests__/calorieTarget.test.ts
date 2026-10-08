import { describe, it, expect } from 'vitest';
import type { NutritionConfig } from '@sistem/types';
import { DEFAULT_NUTRITION_CONFIG } from '../nutrition.config';
import {
  activityFactorFor,
  asksWeightGoal,
  goalFromOnboarding,
  isBelowFloor,
  mifflinBmr,
  recommendPortions,
  suggestCalorieTarget,
  trainingDaysFrom,
} from '../calorieTarget';
import type { CalorieInputs } from '../calorieTarget';
import { mergeNutritionConfig } from '../nutritionSettings.service';

// The calorie calculation is pure code (13c reuses it) — the owner's method (Phase 13a+):
// Mifflin-St Jeor × activity factor → her timeline or the goal %, inside the safety caps,
// never below the floor → portions per group. Every number from the coach's config.

const NOW = new Date('2026-10-08T12:00:00Z');

function inputs(overrides: Partial<CalorieInputs> = {}): CalorieInputs {
  return {
    weight: { kg: 68, source: 'weigh_in', date: '2026-10-01' },
    heightCm: 165,
    birthDate: new Date('1995-04-12T00:00:00Z'),
    gender: 'female',
    trainingFrequency: { minDays: 3, maxDays: 4 },
    goals: ['lose_weight'],
    weightGoal: null,
    today: '2026-10-08',
    ...overrides,
  };
}

describe('Mifflin-St Jeor', () => {
  it('uses +5 for male and −161 for female', () => {
    // 10 × 70 + 6.25 × 175 − 5 × 30 = 1643.75
    expect(mifflinBmr(70, 175, 30, 'male')).toBeCloseTo(1648.75);
    expect(mifflinBmr(70, 175, 30, 'female')).toBeCloseTo(1482.75);
  });
});

describe('activity factor table', () => {
  it('takes her training days as the rounded middle of her min–max answer', () => {
    expect(trainingDaysFrom({ minDays: 3, maxDays: 4 })).toBe(4);
    expect(trainingDaysFrom({ minDays: 2, maxDays: 3 })).toBe(3);
    expect(trainingDaysFrom({ minDays: 5, maxDays: 5 })).toBe(5);
    expect(trainingDaysFrom({ minDays: 1, maxDays: 1 })).toBe(1);
    expect(trainingDaysFrom({ minDays: 7, maxDays: 7 })).toBe(7);
  });

  it("maps days to the owner's levels (1–2 light 1.375, 3–5 moderate 1.55, 6–7 very active 1.725)", () => {
    const factors = [1, 2, 3, 4, 5, 6, 7].map((days) => activityFactorFor(days, DEFAULT_NUTRITION_CONFIG));
    expect(factors).toEqual([1.375, 1.375, 1.55, 1.55, 1.55, 1.725, 1.725]);
  });

  it("uses the coach's own table", () => {
    const config = mergeNutritionConfig({ activityFactors: [1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8] });
    expect(activityFactorFor(4, config)).toBe(1.5);
  });
});

describe('goal mapping (owner decision)', () => {
  it('"lose weight" → fat loss, even with build muscle', () => {
    expect(goalFromOnboarding(['lose_weight'])).toBe('fat_loss');
    expect(goalFromOnboarding(['build_muscle', 'lose_weight'])).toBe('fat_loss');
  });

  it('"build muscle" without "lose weight" → muscle gain', () => {
    expect(goalFromOnboarding(['build_muscle', 'increase_strength'])).toBe('muscle_gain');
  });

  it('anything else → toning / recomp; maintenance is never automatic', () => {
    expect(goalFromOnboarding(['improve_health'])).toBe('recomp');
    expect(goalFromOnboarding([])).toBe('recomp');
  });

  it('asks the weight goal only for weight loss or gain goals', () => {
    expect(asksWeightGoal(['lose_weight'])).toBe(true);
    expect(asksWeightGoal(['build_muscle'])).toBe(true);
    expect(asksWeightGoal(['improve_health', 'move_better'])).toBe(false);
  });
});

describe('suggestCalorieTarget', () => {
  it('BMR × factor → goal adjustment, rounded to 10 kcal, with every input shown', () => {
    const suggestion = suggestCalorieTarget(inputs(), {}, DEFAULT_NUTRITION_CONFIG, NOW);
    // age 31: 680 + 1031.25 − 155 − 161 = 1395.25; × 1.55 = 2162.6; −20% = 1730.1 → 1730
    expect(suggestion).toMatchObject({
      status: 'ok',
      missing: [],
      bmr: 1395,
      tdee: 2163,
      kcal: 1730,
      method: 'goal_percent',
      deltaKcal: -433,
      deltaPct: -20,
      weeklyRateKg: -0.39,
      raisedToFloor: false,
      floorKcal: 1200,
      portions: { protein: 5, carb: 4.5, fat: 5, snack: 0 },
      portionsKcal: 1740,
      inputs: {
        weightKg: 68,
        weightSource: 'weigh_in',
        weightDate: '2026-10-01',
        heightCm: 165,
        ageYears: 31,
        sex: 'female',
        formulaSex: 'female',
        trainingDays: 4,
        activityFactor: 1.55,
        goal: 'fat_loss',
        goalSource: 'onboarding',
        adjustmentPct: -20,
        targetWeightKg: null,
        timelineWeeks: null,
        overridden: [],
      },
    });
  });

  it('aggressive fat loss is −25% (the largest deficit)', () => {
    const suggestion = suggestCalorieTarget(inputs(), { goal: 'fat_loss_aggressive' }, DEFAULT_NUTRITION_CONFIG, NOW);
    expect(suggestion.inputs.adjustmentPct).toBe(-25);
    expect(suggestion.kcal).toBe(1620);
  });

  it("the coach's goal and percentages win", () => {
    const config: NutritionConfig = mergeNutritionConfig({ goalAdjustments: { maintenance: 0, muscle_gain: 15 } });
    const maintenance = suggestCalorieTarget(inputs(), { goal: 'maintenance' }, config, NOW);
    expect(maintenance.kcal).toBe(2160);
    expect(maintenance.inputs.goalSource).toBe('coach');
    const gain = suggestCalorieTarget(inputs(), { goal: 'muscle_gain' }, config, NOW);
    expect(gain.inputs.adjustmentPct).toBe(15);
    expect(gain.kcal).toBe(2490);
  });

  it('sex "other" or missing: no estimate until the coach picks a formula', () => {
    for (const gender of ['other', undefined, '']) {
      const suggestion = suggestCalorieTarget(inputs({ gender }), {}, DEFAULT_NUTRITION_CONFIG, NOW);
      expect(suggestion.status).toBe('needs_formula');
      expect(suggestion.kcal).toBeNull();
      expect(suggestion.inputs.formulaSex).toBeNull();
    }
    const picked = suggestCalorieTarget(inputs({ gender: 'other' }), { formulaSex: 'male' }, DEFAULT_NUTRITION_CONFIG, NOW);
    expect(picked.status).toBe('ok');
    expect(picked.inputs.formulaSex).toBe('male');
  });

  it("the coach's formula pick never overrides her own male / female answer", () => {
    const suggestion = suggestCalorieTarget(inputs(), { formulaSex: 'male' }, DEFAULT_NUTRITION_CONFIG, NOW);
    expect(suggestion.inputs.formulaSex).toBe('female');
  });

  it('lists what is missing and estimates nothing', () => {
    const suggestion = suggestCalorieTarget(
      inputs({ weight: null, heightCm: undefined, birthDate: undefined, trainingFrequency: undefined }),
      {},
      DEFAULT_NUTRITION_CONFIG,
      NOW,
    );
    expect(suggestion.status).toBe('missing_inputs');
    expect(suggestion.missing).toEqual(['weight', 'height', 'birthDate', 'trainingFrequency']);
    expect(suggestion.kcal).toBeNull();
  });

  it('never recommends below the floor: raised to it and flagged', () => {
    const small = inputs({ weight: { kg: 45, source: 'onboarding', date: null }, heightCm: 150, birthDate: new Date('1950-01-01T00:00:00Z'), trainingFrequency: { minDays: 1, maxDays: 1 } });
    const suggestion = suggestCalorieTarget(small, {}, DEFAULT_NUTRITION_CONFIG, NOW);
    // TDEE ≈ 1,164 — already below the floor, so no deficit is left at all.
    expect(suggestion.tdee).toBe(1164);
    expect(suggestion.kcal).toBe(1200);
    expect(suggestion.raisedToFloor).toBe(true);
  });

  it("the coach's overrides replace her data and are listed", () => {
    const suggestion = suggestCalorieTarget(
      inputs(),
      { overrides: { weightKg: 80, activityFactor: 1.2, timelineWeeks: 30, targetWeightKg: 70 } },
      DEFAULT_NUTRITION_CONFIG,
      NOW,
    );
    expect(suggestion.inputs).toMatchObject({ weightKg: 80, weightSource: 'coach', weightDate: null, activityFactor: 1.2, targetWeightKg: 70, timelineWeeks: 30, targetDate: null });
    expect(suggestion.inputs.overridden).toEqual(['weightKg', 'activityFactor', 'targetWeightKg', 'timelineWeeks']);
    expect(suggestion.method).toBe('timeline');
  });
});

describe('timeline (target weight + timeframe)', () => {
  // Dev Trainee Two's numbers: 67.6 kg, 170 cm, 36, female, 3–4 days → TDEE 2,166.
  const her = inputs({
    weight: { kg: 67.6, source: 'weigh_in', date: '2026-10-05' },
    heightCm: 170,
    birthDate: new Date('1990-09-30T00:00:00Z'),
  });
  const goal = (targetWeightKg: number, targetDate: string | null) => ({ ...her, weightGoal: { targetWeightKg, targetDate } });

  it('an unsafe pace is not followed: capped (here by the 25% deficit) with the recommended timeline', () => {
    // 7.6 kg in 8 weeks = 1,045 kcal/day ≈ 48% of TDEE.
    const suggestion = suggestCalorieTarget(goal(60, '2026-12-03'), {}, DEFAULT_NUTRITION_CONFIG, NOW);
    expect(suggestion).toMatchObject({
      method: 'timeline',
      tdee: 2166,
      kcal: 1620,
      expectedWeeks: 16,
      timeline: {
        requestedWeeks: 8,
        requiredDailyKcal: 1045,
        requiredRateKg: 0.95,
        safeRateKg: 0.49,
        unsafe: true,
        limitedBy: 'max_deficit',
        recommendedWeeks: 16,
      },
      inputs: { targetWeightKg: 60, timelineWeeks: 8, targetDate: '2026-12-03' },
    });
  });

  it('a safe pace is followed as asked', () => {
    // 7.6 kg in 20 weeks = 418 kcal/day.
    const suggestion = suggestCalorieTarget(goal(60, '2027-02-25'), {}, DEFAULT_NUTRITION_CONFIG, NOW);
    expect(suggestion.method).toBe('timeline');
    expect(suggestion.timeline).toMatchObject({ requestedWeeks: 20, requiredDailyKcal: 418, unsafe: false, limitedBy: null, recommendedWeeks: null });
    expect(suggestion.kcal).toBe(1750);
  });

  it('caps loss at 1% of body weight per week when that is the tightest limit', () => {
    const lean = inputs({
      weight: { kg: 45, source: 'weigh_in', date: '2026-10-05' },
      heightCm: 175,
      birthDate: new Date('2006-01-01T00:00:00Z'),
      gender: 'male',
      trainingFrequency: { minDays: 7, maxDays: 7 },
      weightGoal: { targetWeightKg: 40, targetDate: '2026-11-05' },
    });
    const suggestion = suggestCalorieTarget(lean, {}, DEFAULT_NUTRITION_CONFIG, NOW);
    // 1% of 45 kg = 0.45 kg/week = 495 kcal/day (25% of TDEE would be 625).
    expect(suggestion.timeline).toMatchObject({ unsafe: true, limitedBy: 'rate', safeRateKg: 0.45, recommendedWeeks: 12 });
    expect(suggestion.kcal).toBe(2000);
  });

  it('caps gain at 0.5% of body weight per week', () => {
    const gaining = inputs({ goals: ['build_muscle'], weight: { kg: 60, source: 'weigh_in', date: '2026-10-05' }, weightGoal: { targetWeightKg: 65, targetDate: '2026-12-17' } });
    const suggestion = suggestCalorieTarget(gaining, {}, DEFAULT_NUTRITION_CONFIG, NOW);
    expect(suggestion.inputs.goal).toBe('muscle_gain');
    expect(suggestion.timeline).toMatchObject({ requestedWeeks: 10, requiredDailyKcal: 550, safeRateKg: 0.3, unsafe: true, limitedBy: 'rate', recommendedWeeks: 17 });
    expect(suggestion.deltaKcal).toBeGreaterThan(0);
  });

  it('never goes below the floor: the floor is one of the limits', () => {
    const small = inputs({
      weight: { kg: 50, source: 'weigh_in', date: '2026-10-05' },
      heightCm: 150,
      birthDate: new Date('1966-01-01T00:00:00Z'),
      trainingFrequency: { minDays: 1, maxDays: 1 },
      weightGoal: { targetWeightKg: 45, targetDate: '2026-11-05' },
    });
    const suggestion = suggestCalorieTarget(small, {}, DEFAULT_NUTRITION_CONFIG, NOW);
    expect(suggestion.timeline?.limitedBy).toBe('floor');
    expect(suggestion.kcal).toBeGreaterThanOrEqual(1200);
  });

  it('a target only (no timeframe) gives the expected timeline at the goal %', () => {
    const suggestion = suggestCalorieTarget(goal(64, null), {}, DEFAULT_NUTRITION_CONFIG, NOW);
    expect(suggestion.method).toBe('goal_percent');
    expect(suggestion.timeline).toBeNull();
    expect(suggestion.expectedWeeks).toBeGreaterThan(0);
  });

  it('ignores a target in the wrong direction, a passed date, a reached target, or a goal without weight change', () => {
    expect(suggestCalorieTarget(goal(70, '2026-12-03'), {}, DEFAULT_NUTRITION_CONFIG, NOW)).toMatchObject({
      method: 'goal_percent',
      timelineNote: 'wrong_direction',
      expectedWeeks: null,
    });
    expect(suggestCalorieTarget(goal(60, '2026-10-01'), {}, DEFAULT_NUTRITION_CONFIG, NOW)).toMatchObject({
      method: 'goal_percent',
      timelineNote: 'date_passed',
    });
    expect(suggestCalorieTarget(goal(67.8, '2026-12-03'), {}, DEFAULT_NUTRITION_CONFIG, NOW).timelineNote).toBe('target_reached');
    expect(suggestCalorieTarget(goal(60, '2026-12-03'), { goal: 'recomp' }, DEFAULT_NUTRITION_CONFIG, NOW).timelineNote).toBe('goal_not_weight');
  });
});

describe('recommended portions', () => {
  it("splits the kcal by the (placeholder) default shares, in halves, closest total (1,500 → 4.5 · 4 · 4)", () => {
    expect(recommendPortions(1500, DEFAULT_NUTRITION_CONFIG)).toEqual({ portions: { protein: 4.5, carb: 4, fat: 4, snack: 0 }, kcal: 1515 });
  });

  it('never adds snack portions (0% share by default) — only the coach does', () => {
    for (const kcal of [1200, 1500, 1730, 2500]) expect(recommendPortions(kcal, DEFAULT_NUTRITION_CONFIG).portions.snack).toBe(0);
  });

  it('follows her own split and group values', () => {
    const config = mergeNutritionConfig({ portionSplit: { protein: 50, carb: 30, fat: 20, snack: 0 }, groupKcal: { protein: 100 } });
    const { portions, kcal } = recommendPortions(1600, config);
    expect(portions.protein).toBe(8);
    expect(Math.abs(kcal - 1600)).toBeLessThanOrEqual(60);
    for (const count of Object.values(portions)) expect(Number.isInteger(count * 2)).toBe(true);
  });
});

describe('floor', () => {
  it('is 1,200 kcal by default and follows the config', () => {
    expect(isBelowFloor(1199, DEFAULT_NUTRITION_CONFIG)).toBe(true);
    expect(isBelowFloor(1200, DEFAULT_NUTRITION_CONFIG)).toBe(false);
    expect(isBelowFloor(1250, mergeNutritionConfig({ floorKcal: 1300 }))).toBe(true);
  });
});

describe('mergeNutritionConfig', () => {
  it('fills what the coach did not set from the defaults; vegetables stay free', () => {
    const config = mergeNutritionConfig({ groupKcal: { protein: 140 } });
    expect(config.groupKcal).toEqual({ protein: 140, carb: 120, fat: 90, snack: 150, vegetable: 0 });
    expect(config.goalAdjustments).toEqual({ fat_loss: -20, fat_loss_aggressive: -25, recomp: -10, muscle_gain: 10, maintenance: 0 });
    expect(config.floorKcal).toBe(1200);
    expect(config).toMatchObject({ kcalPerKg: 7700, maxLossRatePctPerWeek: 1, maxGainRatePctPerWeek: 0.5, maxDeficitPct: 25, ketoMaxCarbPortions: 1 });
    expect(config.portionSplit).toEqual({ protein: 45, carb: 32, fat: 23, snack: 0 });
  });

  it('takes a split only as a whole', () => {
    expect(mergeNutritionConfig({ portionSplit: { protein: 60 } }).portionSplit).toEqual({ protein: 45, carb: 32, fat: 23, snack: 0 });
  });
});
