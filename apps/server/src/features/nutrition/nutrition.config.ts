import type { NutritionConfig } from '@sistem/types';

// THE nutrition numbers (PRD §5.6, Phase 13a). The defaults below are what every coach
// starts with; a coach's own values (NutritionSettings, the dashboard settings screen)
// override them field by field — getEffectiveNutritionConfig() merges the two. The
// calorie module, the plan kcal and the publish rules only ever read the merged config.
// Owner-approved starting values (2026-10-08); the coach tunes them.
export const DEFAULT_NUTRITION_CONFIG: NutritionConfig = {
  // The guide's cap per portion. Vegetables are free and stay 0 (not tunable).
  groupKcal: { protein: 150, carb: 120, fat: 90, vegetable: 0 },
  // Percent added to the maintenance estimate (TDEE).
  goalAdjustments: { fat_loss: -20, recomp: -10, muscle_gain: 10, maintenance: 0 },
  // By training days per week (index 0 = 1 day … index 6 = 7 days). Onboarding has no
  // "0 days", so the sedentary 1.2 is never used.
  activityFactors: [1.375, 1.375, 1.55, 1.55, 1.725, 1.725, 1.9],
  floorKcal: 1200,
};

/** The suggestion is rounded to this many kcal (not tunable — a display choice). */
export const SUGGESTION_ROUND_TO_KCAL = 10;

// Mifflin-St Jeor: 10 × kg + 6.25 × cm − 5 × age + s (a formula, not a setting).
export const MIFFLIN_SEX_CONSTANT = { male: 5, female: -161 } as const;

// Bounds for the coach's overrides — wide enough for any real use, narrow enough that a
// typo can't produce nonsense.
export const NUTRITION_SETTING_BOUNDS = {
  groupKcal: { min: 10, max: 1000 },
  goalAdjustmentPct: { min: -40, max: 40 },
  activityFactor: { min: 1, max: 2.5 },
  floorKcal: { min: 800, max: 2500 },
} as const;

/** 13b (waterTracking): the trainee's quick-add buttons, ml. */
export const WATER_QUICK_ADD_ML = [250, 500] as const;
