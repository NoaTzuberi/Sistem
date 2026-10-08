import type { NutritionConfig } from '@sistem/types';

// THE nutrition numbers (PRD §5.6, Phase 13a). The defaults below are what every coach
// starts with; a coach's own values (NutritionSettings, the dashboard settings screen)
// override them field by field — getEffectiveNutritionConfig() merges the two. The
// calorie module, the plan kcal and the publish rules only ever read the merged config.
// Owner-approved starting values (2026-10-08); the coach tunes them. The calorie method is
// the owner's (docs/reference/calorie-formula.md, Phase 13a+).
export const DEFAULT_NUTRITION_CONFIG: NutritionConfig = {
  // The guide's cap per portion. Vegetables are free and stay 0 (not tunable).
  groupKcal: { protein: 150, carb: 120, fat: 90, vegetable: 0 },
  // Percent added to the maintenance estimate (TDEE). Fat loss = her "moderate" 15–20%,
  // aggressive = her 25% (short-term, coach's choice only).
  goalAdjustments: { fat_loss: -20, fat_loss_aggressive: -25, recomp: -10, muscle_gain: 10, maintenance: 0 },
  // By training days per week (index 0 = 1 day … index 6 = 7 days): light 1–2, moderate
  // 3–5, very active 6–7. Onboarding has no "0 days", so sedentary 1.2 is only ever the
  // coach's own pick in the calculation summary.
  activityFactors: [1.375, 1.375, 1.55, 1.55, 1.55, 1.725, 1.725],
  floorKcal: 1200,
  kcalPerKg: 7700,
  maxLossRatePctPerWeek: 1,
  maxGainRatePctPerWeek: 0.5,
  maxDeficitPct: 25,
  // From the coach's 1,500 template (4.5 protein · 4 carb · 4 fat ≈ 45 / 32 / 23 %).
  portionSplit: { protein: 45, carb: 32, fat: 23 },
  ketoMaxCarbPortions: 1,
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
  kcalPerKg: { min: 5000, max: 9000 },
  lossRatePct: { min: 0.1, max: 2 },
  gainRatePct: { min: 0.1, max: 1 },
  maxDeficitPct: { min: 5, max: 40 },
  portionSplitPct: { min: 0, max: 100 },
  ketoMaxCarbPortions: { min: 0, max: 10 },
} as const;

/** 13b (waterTracking): the trainee's quick-add buttons, ml. */
export const WATER_QUICK_ADD_ML = [250, 500] as const;
