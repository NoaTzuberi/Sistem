import type { NutritionKcal, NutritionMeal } from '@sistem/types';
import { describeMealPortions, formatNumber, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { MEAL_TONES } from '../../data/nutritionSummary';
import './MealsList.css';

interface MealsListProps {
  meals: NutritionMeal[];
  kcal: NutritionKcal;
}

/** The plan's meals as soft cards: a color strip, the coach's meal name, its portions and its kcal. */
export function MealsList({ meals, kcal }: MealsListProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  return (
    <ul className="meals-list">
      {meals.map((meal, index) => {
        const mealKcal = kcal.meals.find((entry) => entry.mealId === meal.id)?.kcal;
        return (
          <li key={meal.id} className={`meals-list-meal meals-list-tone-${(index % MEAL_TONES) + 1}`}>
            <span className="meals-list-strip" aria-hidden="true" />
            <span className="meals-list-text">
              <b className="meals-list-name" dir="auto">
                {meal.name}
              </b>
              <small className="meals-list-portions">{describeMealPortions(meal.portions, meal.vegetablesFree, language)}</small>
            </span>
            {mealKcal !== undefined && (
              <span className="meals-list-kcal">
                <bdi>{formatNumber(mealKcal, language)}</bdi> <small>{shared.units.kcal}</small>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
