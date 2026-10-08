import { describe, it, expect } from 'vitest';
import type { NutritionConfig } from '@sistem/types';
import { DEFAULT_NUTRITION_CONFIG } from '../nutrition.config';
import {
  activityFactorFor,
  goalFromOnboarding,
  isBelowFloor,
  mifflinBmr,
  suggestCalorieTarget,
  trainingDaysFrom,
} from '../calorieTarget';
import type { CalorieInputs } from '../calorieTarget';
import { mergeNutritionConfig } from '../nutritionSettings.service';

// Phase 13a: the calorie target suggestion is pure code (13c reuses it) — Mifflin-St Jeor ×
// activity factor → goal adjustment, every number from the coach's config.

const NOW = new Date('2026-10-08T12:00:00Z');

function inputs(overrides: Partial<CalorieInputs> = {}): CalorieInputs {
  return {
    weight: { kg: 68, source: 'weigh_in', date: '2026-10-01' },
    heightCm: 165,
    birthDate: new Date('1995-04-12T00:00:00Z'),
    gender: 'female',
    trainingFrequency: { minDays: 3, maxDays: 4 },
    goals: ['lose_weight'],
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

  it('maps days to the default factors (1–2 → 1.375, 3–4 → 1.55, 5–6 → 1.725, 7 → 1.9)', () => {
    const factors = [1, 2, 3, 4, 5, 6, 7].map((days) => activityFactorFor(days, DEFAULT_NUTRITION_CONFIG));
    expect(factors).toEqual([1.375, 1.375, 1.55, 1.55, 1.725, 1.725, 1.9]);
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
      belowFloor: false,
      floorKcal: 1200,
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
      },
    });
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

  it('flags a suggestion below the floor (never raises it silently)', () => {
    const small = inputs({ weight: { kg: 45, source: 'onboarding', date: null }, heightCm: 150, birthDate: new Date('1950-01-01T00:00:00Z'), trainingFrequency: { minDays: 1, maxDays: 1 } });
    const suggestion = suggestCalorieTarget(small, {}, DEFAULT_NUTRITION_CONFIG, NOW);
    expect(suggestion.kcal).toBeLessThan(1200);
    expect(suggestion.belowFloor).toBe(true);
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
    expect(config.groupKcal).toEqual({ protein: 140, carb: 120, fat: 90, vegetable: 0 });
    expect(config.goalAdjustments).toEqual({ fat_loss: -20, recomp: -10, muscle_gain: 10, maintenance: 0 });
    expect(config.floorKcal).toBe(1200);
  });
});
