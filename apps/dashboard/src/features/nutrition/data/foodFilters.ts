import type { FoodCategory } from '@sistem/types';

// The food picker's and the food list's category filter (13a+).

/** null = All; 'none' = items without a category. */
export type CategoryFilter = FoodCategory | 'none' | null;

/** Does this item pass the category filter? */
export function matchesCategory(item: { category: FoodCategory | null }, filter: CategoryFilter): boolean {
  if (filter === null) return true;
  if (filter === 'none') return item.category === null;
  return item.category === filter;
}
