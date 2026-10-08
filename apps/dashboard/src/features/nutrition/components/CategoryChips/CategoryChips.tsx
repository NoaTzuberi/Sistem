import type { FoodCategory, FoodGroup } from '@sistem/types';
import { FOOD_CATEGORIES, FOOD_CATEGORY_LABELS, NO_CATEGORY_LABEL } from '@sistem/shared';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import type { CategoryFilter } from '../../data/foodFilters';
import './CategoryChips.css';

interface CategoryChipsProps {
  group: FoodGroup;
  /** The items being filtered (already of `group`) — only categories that have some get a chip. */
  items: readonly { category: FoodCategory | null }[];
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}

/** "All" + the group's categories that have items (single-select). Used by the food picker and the food list. */
export function CategoryChips({ group, items, value, onChange }: CategoryChipsProps) {
  const present = FOOD_CATEGORIES[group].filter((category) => items.some((item) => item.category === category));
  const hasNone = items.some((item) => item.category === null);
  if (present.length === 0) return null;

  const chip = (key: string, label: string, chipValue: CategoryFilter) => (
    <button
      key={key}
      type="button"
      className={'category-chip' + (value === chipValue ? ' category-chip-selected' : '')}
      aria-pressed={value === chipValue}
      onClick={() => onChange(chipValue)}
    >
      {label}
    </button>
  );

  return (
    <div className="category-chips" role="group" aria-label={NUTRITION_COPY.categoryFilter}>
      {chip('all', NUTRITION_COPY.categoryAll, null)}
      {present.map((category) => chip(category, FOOD_CATEGORY_LABELS[category], category))}
      {hasNone && chip('none', NO_CATEGORY_LABEL, 'none')}
    </div>
  );
}
