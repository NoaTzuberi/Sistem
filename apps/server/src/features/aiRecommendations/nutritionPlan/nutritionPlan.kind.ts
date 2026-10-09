import type {
  AiNutritionCalculation,
  AiNutritionInputSummary,
  AiNutritionPlanDraft,
  CalorieSuggestion,
  CalorieSuggestionMissing,
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
  buildNutritionPlanSchema,
  buildNutritionPlanSystemPrompt,
  buildNutritionPlanUserMessage,
} from './nutritionPlanPrompt';
import { validateNutritionPlanReply } from './nutritionPlanValidation';
import type { NutritionPlanValidationContext, StoredNutritionPlan } from './nutritionPlanValidation';
import { msg, type MessageCode, type ServerMessage } from '../../../i18n';
import { getUserLanguage } from '../../users/userLanguage';

// PRD §5.6 (13c): a draft meal structure for the coach. Every number is computed in code by
// the 13a+ calculation (the same one as the builder's calculation summary, with the coach's
// goal / formula / overrides from her working copy); the model only spreads the fixed daily
// portions over the meals and builds options from the filtered food list, plus a summary.

type StoredInput = AiNutritionInputSummary & { foodAliases?: { alias: string; foodItemId: string; name: string }[] };

const MISSING_FIELD_CODES: Record<CalorieSuggestionMissing, MessageCode> = {
  weight: 'ai_field_weight',
  height: 'ai_field_height',
  birthDate: 'ai_field_birth_date',
  trainingFrequency: 'ai_field_training_days',
};

function missingMessage(suggestion: CalorieSuggestion): ServerMessage {
  if (suggestion.status === 'needs_formula') {
    return msg('ai_needs_formula');
  }
  return msg('ai_calculation_missing', { fields: suggestion.missing.map((field) => msg(MISSING_FIELD_CODES[field])) });
}

export const nutritionPlanKind: RecommendationKind<NutritionPlanValidationContext, StoredNutritionPlan> = {
  type: 'nutrition_plan',

  async prepare({ traineeId, coachId }, now) {
    const [response, plan, config, foods, inputs, language] = await Promise.all([
      OnboardingResponse.findOne({ userId: traineeId }).select('answers').lean(),
      NutritionPlan.findOne({ traineeId }).select('calorieTarget').lean(),
      getEffectiveNutritionConfig(coachId),
      listCoachFoods(coachId),
      loadCalorieInputs(traineeId, now),
      getUserLanguage(coachId),
    ]);
    if (!response) {
      return { ok: false, code: RECOMMENDATION_ERROR.notEnoughData, message: msg('ai_no_onboarding'), input: null };
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
    const slots = mealSlotNames(preferences?.mealsPerDay, language);

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
      return {
        ok: false,
        code: RECOMMENDATION_ERROR.notEnoughData,
        message: msg('ai_food_groups_empty', { groups: selection.emptyGroups.map((group) => msg(`group_${group}`)) }),
        input,
      };
    }

    return {
      ok: true,
      promptVersion: NUTRITION_PLAN_PROMPT_VERSION,
      system: buildNutritionPlanSystemPrompt(language),
      userMessage: buildNutritionPlanUserMessage(profile, calculation, slots, selection.candidates),
      schema: buildNutritionPlanSchema(),
      input,
      context: {
        coachId,
        candidates: selection.candidates,
        slots,
        language,
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
