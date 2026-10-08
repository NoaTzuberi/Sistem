import type { NextFunction, Request, Response } from 'express';
import type { NutritionFeatures } from '@sistem/types';

// Feature flags for built-but-closed features (Phase 13b). One server-wide switch per
// feature, read from the environment, default OFF. The server enforces them (a closed
// feature's routes answer 404, its payload fields are refused) and sends them to the
// clients, which only hide / show — never client-only hiding.

export type FeatureFlag = keyof NutritionFeatures;

const FLAG_ENV: Record<FeatureFlag, string> = {
  nutritionRecipes: 'FEATURE_NUTRITION_RECIPES',
  mealLogging: 'FEATURE_MEAL_LOGGING',
  waterTracking: 'FEATURE_WATER_TRACKING',
};

function readFlags(): NutritionFeatures {
  return {
    nutritionRecipes: process.env[FLAG_ENV.nutritionRecipes] === 'true',
    mealLogging: process.env[FLAG_ENV.mealLogging] === 'true',
    waterTracking: process.env[FLAG_ENV.waterTracking] === 'true',
  };
}

let flags = readFlags();

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return flags[flag];
}

/** What the clients get (with the nutrition plan). */
export function getNutritionFeatures(): NutritionFeatures {
  return { ...flags };
}

/** Tests only: open / close flags without touching the environment. */
export function setFeatureFlagsForTests(overrides: Partial<NutritionFeatures> | null): void {
  flags = overrides ? { ...readFlags(), ...overrides } : readFlags();
}

/** A closed feature does not exist for the caller: the same 404 as an unknown route. */
export function requireFeature(flag: FeatureFlag) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (!isFeatureEnabled(flag)) {
      res.status(404).json({ message: 'Not found.' });
      return;
    }
    next();
  };
}
