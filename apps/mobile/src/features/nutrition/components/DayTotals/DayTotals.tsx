import type { FoodGroup, PortionCounts } from '@sistem/types';
import { describePortion, fill, mealPortionList, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { nutritionCopy } from '../../copy';
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
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  return (
    <section className="day-totals" aria-label={copy.coachDayTitle}>
      <h2 className="day-totals-title">{copy.coachDayTitle}</h2>
      <div className="day-totals-list">
        {mealPortionList(portions).map(({ group, count }) => {
          const label = describePortion(group, count, language);
          return (
            <button key={group} type="button" className="day-totals-group" onClick={() => onOpenSwaps(group)} aria-label={fill(copy.openSwaps, { label })}>
              {label}
            </button>
          );
        })}
        {vegetablesFree &&
          (hasVegetableSwaps ? (
            <button type="button" className="day-totals-group" onClick={() => onOpenSwaps('vegetable')}>
              {shared.nutrition.vegetablesFree}
            </button>
          ) : (
            <span className="day-totals-group day-totals-static">{shared.nutrition.vegetablesFree}</span>
          ))}
      </div>
    </section>
  );
}
