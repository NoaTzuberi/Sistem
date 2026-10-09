import type { NutritionConfig, NutritionSettingsPayload, NutritionSettingsResponse } from '@sistem/types';
import { DEFAULT_NUTRITION_CONFIG } from './nutrition.config';
import { PORTION_GROUP_IDS } from './nutrition.constants';
import { NutritionSettings } from './nutritionSettings.model';
import type { NutritionSettingsDocument } from './nutrition.types';
import { LocalizedError } from '../../i18n';

export class NutritionSettingsConflictError extends LocalizedError {}

function cloneDefaults(): NutritionConfig {
  return {
    groupKcal: { ...DEFAULT_NUTRITION_CONFIG.groupKcal },
    goalAdjustments: { ...DEFAULT_NUTRITION_CONFIG.goalAdjustments },
    activityFactors: [...DEFAULT_NUTRITION_CONFIG.activityFactors],
    portionSplit: { ...DEFAULT_NUTRITION_CONFIG.portionSplit },
    floorKcal: DEFAULT_NUTRITION_CONFIG.floorKcal,
    kcalPerKg: DEFAULT_NUTRITION_CONFIG.kcalPerKg,
    maxLossRatePctPerWeek: DEFAULT_NUTRITION_CONFIG.maxLossRatePctPerWeek,
    maxGainRatePctPerWeek: DEFAULT_NUTRITION_CONFIG.maxGainRatePctPerWeek,
    maxDeficitPct: DEFAULT_NUTRITION_CONFIG.maxDeficitPct,
    ketoMaxCarbPortions: DEFAULT_NUTRITION_CONFIG.ketoMaxCarbPortions,
  };
}

const SCALAR_SETTINGS = [
  'floorKcal',
  'kcalPerKg',
  'maxLossRatePctPerWeek',
  'maxGainRatePctPerWeek',
  'maxDeficitPct',
  'ketoMaxCarbPortions',
] as const;

/** Defaults, with each value the coach set taking its place. Vegetables always stay 0. */
export function mergeNutritionConfig(overrides: Partial<NutritionSettingsDocument> | null): NutritionConfig {
  const config = cloneDefaults();
  if (!overrides) return config;
  for (const group of PORTION_GROUP_IDS) {
    const value = overrides.groupKcal?.[group];
    if (typeof value === 'number') config.groupKcal[group] = value;
  }
  for (const goal of Object.keys(config.goalAdjustments) as (keyof NutritionConfig['goalAdjustments'])[]) {
    const value = overrides.goalAdjustments?.[goal];
    if (typeof value === 'number') config.goalAdjustments[goal] = value;
  }
  if (overrides.activityFactors?.length === config.activityFactors.length) {
    config.activityFactors = [...overrides.activityFactors];
  }
  // The split is one choice (it sums to 100): taken whole or not at all.
  // A split saved before snacks existed (13a+) has no snack share: it was 0.
  const split = overrides.portionSplit;
  if (split && (['protein', 'carb', 'fat'] as const).every((group) => typeof split[group] === 'number')) {
    config.portionSplit = { protein: split.protein!, carb: split.carb!, fat: split.fat!, snack: split.snack ?? 0 };
  }
  for (const key of SCALAR_SETTINGS) {
    const value = overrides[key];
    if (typeof value === 'number') config[key] = value;
  }
  return config;
}

export async function getEffectiveNutritionConfig(coachId: string): Promise<NutritionConfig> {
  const overrides = await NutritionSettings.findOne({ coachId }).lean();
  return mergeNutritionConfig(overrides);
}

export async function getNutritionSettings(coachId: string): Promise<NutritionSettingsResponse> {
  return { config: await getEffectiveNutritionConfig(coachId), defaults: cloneDefaults() };
}

/**
 * `foodsAboveCaps`: how many of her items carry more kcal than the new group values —
 * a food's kcal may never exceed its group's value, so those are fixed first.
 */
export async function saveNutritionSettings(
  coachId: string,
  input: NutritionSettingsPayload,
  foodsAboveCaps: (caps: NutritionSettingsPayload['groupKcal']) => Promise<number>,
): Promise<NutritionSettingsResponse> {
  const above = await foodsAboveCaps(input.groupKcal);
  if (above > 0) {
    throw new NutritionSettingsConflictError(above === 1 ? 'settings_food_above_cap_one' : 'settings_food_above_cap_other', {
      count: above,
    });
  }
  await NutritionSettings.updateOne(
    { coachId },
    {
      $set: {
        groupKcal: input.groupKcal,
        goalAdjustments: input.goalAdjustments,
        activityFactors: input.activityFactors,
        portionSplit: input.portionSplit,
        ...Object.fromEntries(SCALAR_SETTINGS.map((key) => [key, input[key]])),
      },
    },
    { upsert: true },
  );
  return getNutritionSettings(coachId);
}
