import type {
  AiNutritionCalculation,
  AiNutritionInputSummary,
  AiNutritionPlanDraft,
  CalorieSuggestion,
  NutritionPreferences,
} from '@sistem/types';
import { OnboardingResponse } from '../../onboarding/onboardingResponse.model';
import { toPublicNutritionPreferences } from '../../onboarding/onboarding.service';
import { recommendPortions, suggestCalorieTarget } from '../../nutrition/calorieTarget';
import { findCoachFoods, listCoachFoods } from '../../nutrition/foodItem.service';
import { toFoodFacts } from '../../nutrition/nutritionMapping';
import { NutritionPlan } from '../../nutrition/nutritionPlan.model';
import { loadCalorieInputs, storedOverrides } from '../../nutrition/nutritionPlan.service';
import { getEffectiveNutritionConfig } from '../../nutrition/nutritionSettings.service';
import { PORTION_GROUP_IDS } from '../../nutrition/nutrition.constants';
import { RECOMMENDATION_ERROR } from '../aiRecommendation.constants';
import type { RecommendationKind } from '../aiRecommendation.kind';
import { mealSlotNames } from './nutritionPlan.constants';
import { selectFoods } from './nutritionPlanFoods';
import { buildNutritionProfile } from './nutritionPlanProfile';
import {
  NUTRITION_PLAN_PROMPT_VERSION,
  NUTRITION_PLAN_SYSTEM_PROMPT,
  buildNutritionPlanSchema,
  buildNutritionPlanUserMessage,
} from './nutritionPlanPrompt';
import { validateNutritionPlanReply } from './nutritionPlanValidation';
import type { NutritionPlanValidationContext, StoredNutritionPlan } from './nutritionPlanValidation';

// PRD §5.6 (13c): a draft meal structure for the coach. Every number is computed in code by
// the 13a+ calculation (the same one as the builder's calculation summary, with the coach's
// goal / formula / overrides from her working copy); the model only spreads the fixed daily
// portions over the meals and builds options from the filtered food list, plus a summary.

type StoredInput = AiNutritionInputSummary & { foodAliases?: { alias: string; foodItemId: string; name: string }[] };

const GROUP_NAMES = { protein: 'protein', carb: 'carb', fat: 'fat', snack: 'snack' } as const;

function missingMessage(suggestion: CalorieSuggestion): string {
  if (suggestion.status === 'needs_formula') {
    return 'Her sex is not male / female, so there is no automatic calculation. Pick the formula (or set a target) in the calculation summary, then generate again.';
  }
  const missing = suggestion.missing.map((field) => (field === 'birthDate' ? 'birth date' : field === 'trainingFrequency' ? 'training days' : field));
  return `The calculation is missing her ${missing.join(', ')}. Fill it in the calculation summary (or set a target), then generate again.`;
}

export const nutritionPlanKind: RecommendationKind<NutritionPlanValidationContext, StoredNutritionPlan> = {
  type: 'nutrition_plan',

  async prepare({ traineeId, coachId }, now) {
    const [response, plan, config, foods, inputs] = await Promise.all([
      OnboardingResponse.findOne({ userId: traineeId }).select('answers').lean(),
      NutritionPlan.findOne({ traineeId }).select('calorieTarget').lean(),
      getEffectiveNutritionConfig(coachId),
      listCoachFoods(coachId),
      loadCalorieInputs(traineeId, now),
    ]);
    if (!response) {
      return { ok: false, code: RECOMMENDATION_ERROR.notEnoughData, message: 'She has no onboarding answers yet.', input: null };
    }

    const stored = response.answers.nutritionPreferences;
    const preferences: NutritionPreferences | null = stored ? toPublicNutritionPreferences(stored) : null;
    // The coach's choices in her working copy, so the draft matches the calculation summary she sees.
    const target = plan?.calorieTarget;
    const suggestion = suggestCalorieTarget(
      inputs,
      { goal: target?.goal ?? null, formulaSex: target?.formulaSex ?? null, overrides: target ? storedOverrides(target) : null },
      config,
      now,
    );
    const profile = buildNutritionProfile(response.answers, preferences, suggestion);
    const slots = mealSlotNames(preferences?.mealsPerDay);

    const planKcal = target?.kcal ?? null;
    const kcal = planKcal ?? (suggestion.status === 'ok' ? suggestion.kcal : null);
    const baseInput: StoredInput = {
      profile,
      calculation: null,
      meals: slots,
      foods: Object.fromEntries(PORTION_GROUP_IDS.map((group) => [group, { sent: 0, filteredOut: 0 }])) as StoredInput['foods'],
      excludedTags: [],
      promptVersion: NUTRITION_PLAN_PROMPT_VERSION,
    };
    if (kcal === null) {
      return { ok: false, code: RECOMMENDATION_ERROR.notEnoughData, message: missingMessage(suggestion), input: baseInput };
    }

    const recommended = recommendPortions(kcal, config);
    const ok = suggestion.status === 'ok';
    const calculation: AiNutritionCalculation = {
      targetSource: planKcal !== null ? 'plan' : 'suggestion',
      kcal,
      bmr: ok ? suggestion.bmr : null,
      tdee: ok ? suggestion.tdee : null,
      deltaKcal: ok && suggestion.tdee !== null ? kcal - suggestion.tdee : null,
      method: ok ? suggestion.method : null,
      weeklyRateKg: planKcal === null ? suggestion.weeklyRateKg : null,
      expectedWeeks: planKcal === null ? suggestion.expectedWeeks : null,
      unsafePace: suggestion.timeline?.unsafe ?? false,
      recommendedWeeks: suggestion.timeline?.recommendedWeeks ?? null,
      raisedToFloor: planKcal === null && suggestion.raisedToFloor,
      dailyPortions: recommended.portions,
      portionsKcal: recommended.kcal,
      groupKcal: Object.fromEntries(PORTION_GROUP_IDS.map((group) => [group, config.groupKcal[group]])) as AiNutritionCalculation['groupKcal'],
    };

    const selection = selectFoods(foods, preferences, recommended.portions);
    const input: StoredInput = {
      ...baseInput,
      calculation,
      foods: selection.counts,
      excludedTags: selection.excludedTags,
      foodAliases: selection.candidates.map(({ alias, food }) => ({ alias, foodItemId: food.id, name: food.name })),
    };

    if (selection.emptyGroups.length > 0) {
      const groups = selection.emptyGroups.map((group) => GROUP_NAMES[group]).join(', ');
      return {
        ok: false,
        code: RECOMMENDATION_ERROR.notEnoughData,
        message: `After her restrictions, no ${groups} items are left in your food list — build this plan by hand (or add items).`,
        input,
      };
    }

    return {
      ok: true,
      promptVersion: NUTRITION_PLAN_PROMPT_VERSION,
      system: NUTRITION_PLAN_SYSTEM_PROMPT,
      userMessage: buildNutritionPlanUserMessage(profile, calculation, slots, selection.candidates),
      schema: buildNutritionPlanSchema(),
      input,
      context: {
        coachId,
        candidates: selection.candidates,
        slots,
        dailyPortions: recommended.portions,
        kcal,
        preferences,
        config,
      },
    };
  },

  validate: validateNutritionPlanReply,

  // The alias list is long and only useful for debugging: kept in the database.
  presentInput(input): AiNutritionInputSummary {
    const { foodAliases: _aliases, ...summary } = input as unknown as StoredInput;
    return summary;
  },

  async present(output, { coachId }): Promise<AiNutritionPlanDraft> {
    const ids = output.meals.flatMap((meal) => meal.options.flatMap((option) => option.lines.map((line) => line.foodItemId)));
    const foods = await findCoachFoods(coachId, [...new Set(ids)]);
    return {
      ...output,
      meals: output.meals.map((meal) => ({
        ...meal,
        options: meal.options.map((option) => ({
          ...option,
          lines: option.lines.map((line) => {
            const food = foods.get(line.foodItemId);
            return { ...line, ...(food ? { food: { ...toFoodFacts(food), archived: food.archivedAt !== null } } : {}) };
          }),
        })),
      })),
    };
  },
};
