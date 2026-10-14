import type { FoodGroup, PortionCounts, PortionGroup } from '@sistem/types';

// The trainee's Nutrition tab summary. The plan is built from exchange-list portions, not macros:
// the donut and bars show each portion group's share of the day's kcal (portions × the group's
// kcal per portion, from the coach's config). Grams per macro have no data source — not shown.

const GROUP_ORDER: readonly PortionGroup[] = ['protein', 'carb', 'fat', 'snack'];

export interface GroupShare {
  group: PortionGroup;
  portions: number;
  kcal: number;
  /** 0–1 of the day's kcal. */
  share: number;
}

/** The day's portion groups with their kcal share (protein, carb, fat always; snack only when planned). */
export function groupShares(dayPortions: PortionCounts, groupKcal: Record<FoodGroup, number>): GroupShare[] {
  const rows = GROUP_ORDER.filter((group) => group !== 'snack' || dayPortions.snack > 0).map((group) => ({
    group,
    portions: dayPortions[group],
    kcal: dayPortions[group] * groupKcal[group],
  }));
  const total = rows.reduce((sum, row) => sum + row.kcal, 0);
  return rows.map((row) => ({ ...row, share: total > 0 ? row.kcal / total : 0 }));
}

/** The meals' color strips cycle through four soft identity colors. */
export const MEAL_TONES = 4;
