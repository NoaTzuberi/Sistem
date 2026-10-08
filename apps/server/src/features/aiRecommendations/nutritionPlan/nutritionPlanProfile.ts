import type { AiNutritionFreeText, AiNutritionProfile, CalorieSuggestion, NutritionPreferences } from '@sistem/types';
import type { OnboardingAnswersFields } from '../../onboarding/onboardingResponse.model';
import { scrubFreeText } from '../trainingPlan/trainingPlanProfile';

// What the model may know about her for the nutrition draft (owner decision, Phase 13c):
// the same rules as the training draft — option ids, rounded numbers, age instead of the
// birth date, cleaned free text. Never her name, email, ids, photos, logs or body history.
// Her restrictions go as ids: they are already enforced in code (the food list is filtered).

function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/** Every text she wrote in the nutrition step, cleaned (emails / phones removed, trimmed). */
export function collectFreeText(preferences: NutritionPreferences | null): AiNutritionFreeText[] {
  if (!preferences) return [];
  const texts: AiNutritionFreeText[] = [];
  const add = (source: string, value: string | undefined) => {
    const text = scrubFreeText(value);
    if (text) texts.push({ source, text });
  };
  add(`diet_type:${preferences.dietType}`, preferences.dietTypeDetails);
  for (const item of preferences.dietStyles) add(`diet_style:${item.id}`, item.details);
  for (const item of preferences.religious) add(`religious:${item.id}`, item.details);
  for (const item of preferences.intolerances) add(`intolerance:${item.id}`, item.details);
  for (const item of preferences.allergies) add(`allergy:${item.id}`, item.details);
  add('foods_loved', preferences.foodsLoved);
  add('foods_disliked', preferences.foodsDisliked);
  return texts;
}

/**
 * Her numbers are the ones the calculation used (the coach's overrides included), rounded.
 * The weight goal's weeks are what is left of her timeframe.
 */
export function buildNutritionProfile(
  answers: OnboardingAnswersFields,
  preferences: NutritionPreferences | null,
  suggestion: CalorieSuggestion,
): AiNutritionProfile {
  const inputs = suggestion.inputs;
  const frequency = answers.trainingFrequency;
  return {
    ageYears: inputs.ageYears ?? undefined,
    heightCm: inputs.heightCm !== null ? Math.round(inputs.heightCm) : undefined,
    weightKg: inputs.weightKg !== null ? Math.round(inputs.weightKg) : undefined,
    gender: answers.gender || undefined,
    goals: answers.goals ?? [],
    trainingDays: frequency ? { min: frequency.minDays, max: frequency.maxDays } : undefined,
    weightGoal:
      inputs.targetWeightKg !== null
        ? {
            targetWeightKg: roundHalf(inputs.targetWeightKg),
            weeks: inputs.timelineWeeks !== null ? Math.round(inputs.timelineWeeks * 10) / 10 : null,
          }
        : undefined,
    nutritionAnswered: preferences !== null,
    dietType: preferences?.dietType,
    dietStyles: preferences?.dietStyles.map((item) => item.id) ?? [],
    religious: preferences?.religious.map((item) => item.id) ?? [],
    intolerances: preferences?.intolerances.map((item) => item.id) ?? [],
    allergies: preferences?.allergies.map((item) => item.id) ?? [],
    mealsPerDay: preferences?.mealsPerDay ?? null,
    freeText: collectFreeText(preferences),
  };
}
