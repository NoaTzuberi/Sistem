import type { DietTag, NutritionPreferences } from '@sistem/types';
import { ALLERGY_TAG, DIET_TYPE_EXCLUDED_TAGS, KOSHER_DAIRY_TAGS, KOSHER_MEAT_TAGS } from './nutrition.constants';

// Her onboarding nutrition preferences checked against the coach's food diet tags — pure,
// so the builder's warnings (13a) and the AI food filter (13c) use the same rules.
// Free-text allergies and dislikes can't be checked by code: the coach reads them.

export type FoodConflictReason = { kind: 'diet'; tag: DietTag } | { kind: 'allergy'; tag: DietTag };

/** The tags her diet type and allergies rule out, each with the reason. */
export function excludedTags(preferences: NutritionPreferences): Map<DietTag, FoodConflictReason> {
  const excluded = new Map<DietTag, FoodConflictReason>();
  for (const tag of DIET_TYPE_EXCLUDED_TAGS[preferences.dietType]) {
    excluded.set(tag, { kind: 'diet', tag });
  }
  // An allergy is the stronger reason when both apply.
  for (const allergy of preferences.allergies) {
    const tag = ALLERGY_TAG[allergy];
    excluded.set(tag, { kind: 'allergy', tag });
  }
  return excluded;
}

/** Why this food doesn't fit her (empty = it fits). */
export function findFoodConflicts(dietTags: readonly DietTag[], preferences: NutritionPreferences): FoodConflictReason[] {
  const excluded = excludedTags(preferences);
  return dietTags.flatMap((tag) => {
    const reason = excluded.get(tag);
    return reason ? [reason] : [];
  });
}

/** Kosher: meat (poultry included) and dairy in the same option. */
export function hasKosherConflict(optionTags: readonly (readonly DietTag[])[]): boolean {
  const tags = new Set(optionTags.flat());
  return KOSHER_MEAT_TAGS.some((tag) => tags.has(tag)) && KOSHER_DAIRY_TAGS.some((tag) => tags.has(tag));
}
