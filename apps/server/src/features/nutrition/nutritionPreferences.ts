import type { DietTag, NutritionPreferences, PortionCounts } from '@sistem/types';
import {
  ALLERGY_TAG,
  DIET_TYPE_EXCLUDED_TAGS,
  INTOLERANCE_TAG,
  KOSHER_DAIRY_TAGS,
  KOSHER_MEAT_TAGS,
  RELIGIOUS_EXCLUDED_TAGS,
} from './nutrition.constants';

// Her onboarding nutrition preferences checked against the coach's food diet tags — pure,
// so the builder's warnings (13a) and the AI food filter (13c) use the same rules.
// Answers without a tag (keto, fasting, every "other", details, loves / dislikes) can't be
// checked by code: the coach reads them.

/** Why a tag is ruled out; `source` is the answer id (e.g. 'vegan', 'kosher', 'lactose_free'). */
export interface FoodConflictReason {
  kind: 'diet' | 'religious' | 'intolerance' | 'allergy';
  tag: DietTag;
  source: string;
}

/** The tags her answers rule out, each with the strongest reason (allergy > intolerance > religious > diet). */
export function excludedTags(preferences: NutritionPreferences): Map<DietTag, FoodConflictReason> {
  const excluded = new Map<DietTag, FoodConflictReason>();
  const add = (reason: FoodConflictReason) => excluded.set(reason.tag, reason);

  for (const tag of DIET_TYPE_EXCLUDED_TAGS[preferences.dietType]) add({ kind: 'diet', tag, source: preferences.dietType });
  for (const { id } of preferences.religious) {
    for (const tag of RELIGIOUS_EXCLUDED_TAGS[id]) add({ kind: 'religious', tag, source: id });
  }
  for (const { id } of preferences.intolerances) {
    const tag = INTOLERANCE_TAG[id];
    if (tag) add({ kind: 'intolerance', tag, source: id });
  }
  for (const { id } of preferences.allergies) {
    const tag = ALLERGY_TAG[id];
    if (tag) add({ kind: 'allergy', tag, source: id });
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

export function keepsKosher(preferences: NutritionPreferences | null): boolean {
  return preferences?.religious.some((item) => item.id === 'kosher') ?? false;
}

export function followsKeto(preferences: NutritionPreferences | null): boolean {
  return preferences?.dietStyles.some((item) => item.id === 'keto_low_carb') ?? false;
}

/** Kosher: meat (poultry included) and dairy in the same option. */
export function hasKosherConflict(optionTags: readonly (readonly DietTag[])[]): boolean {
  const tags = new Set(optionTags.flat());
  return KOSHER_MEAT_TAGS.some((tag) => tags.has(tag)) && KOSHER_DAIRY_TAGS.some((tag) => tags.has(tag));
}

/** Keto / low-carb: more carb portions over the day than the coach's config allows. */
export function hasKetoConflict(dayPortions: PortionCounts, ketoMaxCarbPortions: number): boolean {
  return dayPortions.carb > ketoMaxCarbPortions;
}
