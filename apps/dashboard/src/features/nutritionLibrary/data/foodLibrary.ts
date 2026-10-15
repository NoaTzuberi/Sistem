import type { FoodGroup, FoodItem } from '@sistem/types';
import { searchByText } from '@sistem/shared';
import { matchesCategory } from '../../nutrition/data/foodFilters';
import type { CategoryFilter } from '../../nutrition/data/foodFilters';

// The food list's pure rules: what a card warns about, and which items a filter shows.

/** free = no cap (vegetables); missing = no kcal yet; over = above the group's cap (a coach fix). */
export type KcalStatus = 'ok' | 'missing' | 'over' | 'free';

export function kcalStatus(item: Pick<FoodItem, 'kcal'>, cap: number): KcalStatus {
  if (cap <= 0) return 'free';
  if (item.kcal === null) return 'missing';
  return item.kcal > cap ? 'over' : 'ok';
}

/** The share of the cap a kcal fills, 0–1 (a bar). */
export function capShare(kcal: number, cap: number): number {
  return cap > 0 ? Math.min(1, Math.max(0, kcal / cap)) : 0;
}

export interface FoodFilter {
  group: FoodGroup | null;
  category: CategoryFilter;
  query: string;
  showArchived: boolean;
}

/** Items that pass the filter; a search orders by match (best first), otherwise the list's own order. */
export function filterFoods(foods: readonly FoodItem[], filter: FoodFilter, searchText: (item: FoodItem) => string): FoodItem[] {
  const passing = foods.filter(
    (food) =>
      (filter.showArchived || !food.archivedAt) &&
      (filter.group === null || food.group === filter.group) &&
      (filter.group === null || matchesCategory(food, filter.category)),
  );
  return searchByText(passing, filter.query, searchText);
}
