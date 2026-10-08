import type { DietTag, FoodItem, NutritionPreferences, PortionCounts, PortionGroup } from '@sistem/types';
import { PORTION_GROUP_IDS } from '../../nutrition/nutrition.constants';
import { compareFoods } from '../../nutrition/nutritionMapping';
import { excludedTags } from '../../nutrition/nutritionPreferences';
import { MAX_FOOD_ALIASES } from './nutritionPlan.constants';

// The grounding (PRD §5.6): her preferences are enforced IN CODE before the model sees
// anything. Only the coach's active items whose diet tags her answers allow are sent; a
// filtered-out item is never sent, so the model cannot pick it. Snack items go only when
// the computed day has snack portions (the AI never adds any).

export interface FoodCandidate {
  /** 'F001' … — what the model sees and answers with. */
  alias: string;
  food: Pick<FoodItem, 'id' | 'group' | 'name' | 'portion' | 'category' | 'dietTags'> & { group: PortionGroup };
}

export interface FoodSelection {
  candidates: FoodCandidate[];
  counts: Record<PortionGroup, { sent: number; filteredOut: number }>;
  excludedTags: DietTag[];
  /** Groups the day needs portions of but no allowed item is left in. */
  emptyGroups: PortionGroup[];
}

export function foodAlias(index: number): string {
  return `F${String(index + 1).padStart(3, '0')}`;
}

function isPortionGroup(group: FoodItem['group']): group is PortionGroup {
  return (PORTION_GROUP_IDS as readonly string[]).includes(group);
}

/** Pure: the coach's list (any order, archived included) → what may be sent for her. */
export function selectFoods(
  foods: readonly FoodItem[],
  preferences: NutritionPreferences | null,
  dailyPortions: PortionCounts,
): FoodSelection {
  const excluded = preferences ? excludedTags(preferences) : new Map<DietTag, unknown>();
  const counts = Object.fromEntries(PORTION_GROUP_IDS.map((group) => [group, { sent: 0, filteredOut: 0 }])) as FoodSelection['counts'];

  const allowed: FoodCandidate['food'][] = [];
  const sorted = [...foods].sort((a, b) => a.group.localeCompare(b.group) || compareFoods(a, b));
  for (const food of sorted) {
    // Vegetables are free (no portions) and archived items are never offered.
    if (food.archivedAt || !isPortionGroup(food.group)) continue;
    if (dailyPortions[food.group] <= 0) continue;
    if (food.dietTags.some((tag) => excluded.has(tag))) {
      counts[food.group].filteredOut += 1;
      continue;
    }
    allowed.push({
      id: food.id,
      group: food.group,
      name: food.name,
      portion: food.portion,
      category: food.category,
      dietTags: food.dietTags,
    });
  }

  // Groups in the fixed order, so the list reads protein → carb → fat → snack.
  const ordered = PORTION_GROUP_IDS.flatMap((group) => allowed.filter((food) => food.group === group));
  const candidates = ordered.slice(0, MAX_FOOD_ALIASES).map((food, index) => ({ alias: foodAlias(index), food }));
  for (const { food } of candidates) counts[food.group].sent += 1;

  return {
    candidates,
    counts,
    excludedTags: [...excluded.keys()],
    emptyGroups: PORTION_GROUP_IDS.filter((group) => dailyPortions[group] > 0 && counts[group].sent === 0),
  };
}
