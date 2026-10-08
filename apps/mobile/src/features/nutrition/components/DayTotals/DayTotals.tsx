import type { FoodGroup, PortionCounts } from '@sistem/types';
import { VEGETABLES_FREE_LABEL, describePortion, mealPortionList } from '@sistem/shared';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './DayTotals.css';

interface DayTotalsProps {
  portions: PortionCounts;
  vegetablesFree: boolean;
  hasVegetableSwaps: boolean;
  onOpenSwaps: (group: FoodGroup) => void;
}

/**
 * The day's totals per group ("4 protein · 4 carb · 4 fat · vegetables free"), each a
 * button to that group's swaps — read-only, for coach mode (the trainee's tracker shows
 * the same with circles).
 */
export function DayTotals({ portions, vegetablesFree, hasVegetableSwaps, onOpenSwaps }: DayTotalsProps) {
  return (
    <section className="day-totals" aria-label={NUTRITION_COPY.coachDayTitle}>
      <h2 className="day-totals-title">{NUTRITION_COPY.coachDayTitle}</h2>
      <div className="day-totals-list">
        {mealPortionList(portions).map(({ group, count }) => {
          const label = describePortion(group, count);
          return (
            <button key={group} type="button" className="day-totals-group" onClick={() => onOpenSwaps(group)} aria-label={NUTRITION_COPY.openSwaps(label)}>
              {label}
            </button>
          );
        })}
        {vegetablesFree &&
          (hasVegetableSwaps ? (
            <button type="button" className="day-totals-group" onClick={() => onOpenSwaps('vegetable')}>
              {VEGETABLES_FREE_LABEL}
            </button>
          ) : (
            <span className="day-totals-group day-totals-static">{VEGETABLES_FREE_LABEL}</span>
          ))}
      </div>
    </section>
  );
}
