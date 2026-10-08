import type {
  NutritionPreferences,
  OnboardingAnswers,
  OnboardingAnswersPayload,
  PreferenceItem,
  WeightUnit,
} from '@sistem/types';
import { parseDecimalInput, summarizeHowIEat, summarizeRestrictions, toDisplayWeight } from '@sistem/shared';
import { INITIAL_ONBOARDING_STATE } from '../types';
import type { FormPreferenceItem, OnboardingFormState } from '../types';

// The "Nutrition & goal" step (Phase 13a+) as plain functions: form state ↔ API, the
// chip rules, and what Continue needs. The server re-validates everything.

type FormPreferences = OnboardingFormState['nutritionPreferences'];
type FormWeightGoal = OnboardingFormState['weightGoal'];

export const MAX_DETAILS_LENGTH = 300;
export const MAX_FOOD_TEXT_LENGTH = 500;
const WEEKS_RANGE = { min: 1, max: 104 };

/** "My goal" is asked only when her goals include losing or gaining weight. */
export function asksWeightGoal(goals: readonly string[]): boolean {
  return goals.includes('lose_weight') || goals.includes('build_muscle');
}

function toItems<T extends string>(items: readonly FormPreferenceItem<T>[]): PreferenceItem<T>[] {
  return items.map((item) => ({ id: item.id, ...(item.details.trim() ? { details: item.details.trim() } : {}) }));
}

function fromItems<T extends string>(items: readonly PreferenceItem<T>[] | undefined): FormPreferenceItem<T>[] {
  return (items ?? []).map((item) => ({ id: item.id, details: item.details ?? '' }));
}

export function toPreferencesPayload(form: FormPreferences): NutritionPreferences {
  return {
    dietType: form.dietType,
    ...(form.dietType !== 'none' && form.dietTypeDetails.trim() ? { dietTypeDetails: form.dietTypeDetails.trim() } : {}),
    dietStyles: toItems(form.dietStyles),
    religious: toItems(form.religious),
    intolerances: toItems(form.intolerances),
    allergies: toItems(form.allergies),
    ...(form.foodsLoved.trim() ? { foodsLoved: form.foodsLoved.trim() } : {}),
    ...(form.foodsDisliked.trim() ? { foodsDisliked: form.foodsDisliked.trim() } : {}),
    mealsPerDay: form.mealsPerDay,
  };
}

/** Her weight goal for the API: null when the target is empty (clears a saved goal). */
export function toWeightGoalPayload(form: FormWeightGoal): OnboardingAnswersPayload['weightGoal'] {
  const target = parseDecimalInput(form.targetWeight);
  if (target === null) return null;
  const weeks = Number(form.weeks);
  const timeframe =
    form.timeframeKind === 'weeks' && form.weeks !== ''
      ? { kind: 'weeks' as const, weeks }
      : form.timeframeKind === 'date' && form.date
        ? { kind: 'date' as const, date: form.date }
        : null;
  return { targetWeight: target, timeframe };
}

export function fromAnswers(answers: OnboardingAnswers | null | undefined, weightUnit: WeightUnit) {
  const saved = answers?.nutritionPreferences;
  const goal = answers?.weightGoal;
  const nutritionPreferences: FormPreferences = saved
    ? {
        dietType: saved.dietType,
        dietTypeDetails: saved.dietTypeDetails ?? '',
        dietStyles: fromItems(saved.dietStyles),
        religious: fromItems(saved.religious),
        intolerances: fromItems(saved.intolerances),
        allergies: fromItems(saved.allergies),
        foodsLoved: saved.foodsLoved ?? '',
        foodsDisliked: saved.foodsDisliked ?? '',
        mealsPerDay: saved.mealsPerDay ?? null,
      }
    : INITIAL_ONBOARDING_STATE.nutritionPreferences;
  const weightGoal: FormWeightGoal = goal
    ? {
        targetWeight: String(toDisplayWeight(goal.targetWeightKg, weightUnit)),
        timeframeKind: goal.timeframe?.kind ?? null,
        weeks: goal.timeframe?.kind === 'weeks' ? String(goal.timeframe.weeks) : '',
        date: goal.timeframe?.kind === 'date' ? goal.timeframe.date : '',
      }
    : INITIAL_ONBOARDING_STATE.weightGoal;
  return { nutritionPreferences, weightGoal };
}

/** Adds the item, or takes it away when already chosen. */
export function toggleItem<T extends string>(items: readonly FormPreferenceItem<T>[], id: T): FormPreferenceItem<T>[] {
  return items.some((item) => item.id === id) ? items.filter((item) => item.id !== id) : [...items, { id, details: '' }];
}

export function setItemDetails<T extends string>(items: readonly FormPreferenceItem<T>[], id: T, details: string): FormPreferenceItem<T>[] {
  return items.map((item) => (item.id === id ? { ...item, details } : item));
}

/** Every chosen "other" needs her text. */
function otherIsDescribed(items: readonly FormPreferenceItem<string>[]): boolean {
  return items.every((item) => item.id !== 'other' || item.details.trim().length > 0);
}

export function isGoalValid(form: FormWeightGoal): boolean {
  if (form.targetWeight.trim() === '') return true;
  const target = parseDecimalInput(form.targetWeight);
  if (target === null || target <= 0) return false;
  if (form.timeframeKind === 'weeks' && form.weeks !== '') {
    const weeks = Number(form.weeks);
    return Number.isInteger(weeks) && weeks >= WEEKS_RANGE.min && weeks <= WEEKS_RANGE.max;
  }
  return true;
}

/** What Continue needs: every "other" described and a goal that makes sense (or none). */
export function isNutritionStepValid(state: OnboardingFormState): boolean {
  const preferences = state.nutritionPreferences;
  return (
    otherIsDescribed(preferences.dietStyles) &&
    otherIsDescribed(preferences.intolerances) &&
    otherIsDescribed(preferences.allergies) &&
    (!asksWeightGoal(state.goals) || isGoalValid(state.weightGoal))
  );
}

/** The collapsed "How I eat" / "Intolerances & allergies" lines ('' = nothing chosen). */
export function summarizeSections(form: FormPreferences): { howIEat: string; restrictions: string } {
  const preferences = toPreferencesPayload(form);
  return { howIEat: summarizeHowIEat(preferences), restrictions: summarizeRestrictions(preferences) };
}
