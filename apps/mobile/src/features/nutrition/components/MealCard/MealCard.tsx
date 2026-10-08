import type { FoodGroup, NutritionViewMeal } from '@sistem/types';
import { FOOD_GROUP_LABELS, VEGETABLES_FREE_LABEL, describePortion, describeViewLine, mealPortionList } from '@sistem/shared';
import { IconChevronRight } from '@tabler/icons-react';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './MealCard.css';

interface MealCardProps {
  meal: NutritionViewMeal;
  /** Tapping a portion (or a food line) opens every swap of its group. */
  onOpenSwaps: (group: FoodGroup, foodId?: string) => void;
  /** Vegetables open a list only when the coach has vegetable items. */
  hasVegetableSwaps: boolean;
}

/** One meal: its portions per group (the focus), then the coach's options, as written. */
export function MealCard({ meal, onOpenSwaps, hasVegetableSwaps }: MealCardProps) {
  const portions = mealPortionList(meal.portions);

  return (
    <article className="meal-card">
      <h2 className="meal-card-name" dir="auto">
        {meal.name}
      </h2>

      {(portions.length > 0 || meal.vegetablesFree) && (
        <div className="meal-card-portions">
          {portions.map(({ group, count }) => {
            const label = describePortion(group, count);
            return (
              <button
                key={group}
                type="button"
                className={`meal-card-portion meal-card-portion-${group}`}
                onClick={() => onOpenSwaps(group)}
                aria-label={NUTRITION_COPY.openSwaps(label)}
              >
                {label}
              </button>
            );
          })}
          {meal.vegetablesFree &&
            (hasVegetableSwaps ? (
              <button type="button" className="meal-card-portion meal-card-portion-vegetable" onClick={() => onOpenSwaps('vegetable')}>
                {VEGETABLES_FREE_LABEL}
              </button>
            ) : (
              <span className="meal-card-portion meal-card-portion-static">{VEGETABLES_FREE_LABEL}</span>
            ))}
        </div>
      )}

      {meal.options.map((option) => (
        <section key={option.id} className="meal-card-option" aria-label={option.label}>
          <h3 className="meal-card-option-label" dir="auto">
            {option.label}
          </h3>
          <ul className="meal-card-lines">
            {option.lines.map((line) => {
              const { title, detail } = describeViewLine(line);
              const content = (
                <>
                  <span className="meal-card-line-text">
                    <span className="meal-card-line-title" dir="auto">
                      {title}
                    </span>
                    {detail && (
                      <span className="meal-card-line-detail" dir="auto">
                        {detail}
                      </span>
                    )}
                  </span>
                  {line.food && <IconChevronRight className="meal-card-line-icon" size={18} aria-hidden="true" />}
                </>
              );
              return (
                <li key={line.id}>
                  {line.food ? (
                    <button
                      type="button"
                      className="meal-card-line meal-card-line-button"
                      onClick={() => onOpenSwaps(line.food!.group, line.food!.id)}
                      aria-label={`${title} — ${NUTRITION_COPY.swapsTitle(FOOD_GROUP_LABELS[line.food.group])}`}
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="meal-card-line">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </article>
  );
}
