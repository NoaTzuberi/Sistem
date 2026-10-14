import type { FoodGroup, FoodItem, NutritionIssue, NutritionTemplate } from '@sistem/types';
import { fill, useCopy } from '@sistem/shared';
import { nutritionCopy } from '../../copy';
import { sectionId } from '../../data/scrollToSection';
import { portionsKcal } from '../../hooks/usePortionBudget';
import { move, newMeal } from '../../nutritionDraft';
import type { DraftMeal } from '../../nutritionDraft';
import { MealCard } from '../MealCard/MealCard';
import { TemplatePicker } from '../TemplatePicker/TemplatePicker';
import './MealsSection.css';

interface MealsSectionProps {
  meals: DraftMeal[];
  onMealsChange: (update: (meals: DraftMeal[]) => DraftMeal[]) => void;
  groupKcal: Record<FoodGroup, number>;
  foods: FoodItem[];
  recentFoodIds: Partial<Record<FoodGroup, string[]>>;
  foodsById: Map<string, FoodItem>;
  issues: NutritionIssue[];
  templates: NutritionTemplate[];
  onApplyTemplate: (templateId: string) => Promise<boolean>;
}

/** Step 2: the meals, a template to start from, and "+ meal". */
export function MealsSection({ meals, onMealsChange, groupKcal, foods, recentFoodIds, foodsById, issues, templates, onApplyTemplate }: MealsSectionProps) {
  const copy = useCopy(nutritionCopy);
  return (
    <section className="nb-card" id={sectionId('meals')} aria-labelledby="nb-meals-title">
      <header className="nb-card-head">
        <span className="nb-card-number" aria-hidden="true">2</span>
        <h2 className="nb-card-title" id="nb-meals-title" tabIndex={-1}>
          {copy.builder.step2}
        </h2>
        <div className="nb-card-tools">
          <TemplatePicker templates={templates} onApply={onApplyTemplate} />
        </div>
      </header>

      <div className="nb-meals">
        {meals.length === 0 && <p className="nb-note">{copy.noMeals}</p>}
        {meals.map((meal, index) => (
          <MealCard
            key={meal.key}
            meal={meal}
            index={index}
            count={meals.length}
            kcal={portionsKcal(meal.portions, groupKcal)}
            foods={foods}
            recentFoodIds={recentFoodIds}
            foodsById={foodsById}
            issues={issues.filter((issue) => issue.mealIndex === index)}
            onChange={(next) => onMealsChange((current) => current.map((m, i) => (i === index ? next : m)))}
            onRemove={() => onMealsChange((current) => current.filter((_, i) => i !== index))}
            onMove={(offset) => onMealsChange((current) => move(current, index, offset))}
          />
        ))}
        <button
          className="nb-add-meal"
          type="button"
          onClick={() => onMealsChange((current) => [...current, newMeal(fill(copy.builder.newMealName, { number: current.length + 1 }))])}
        >
          {copy.addMeal}
        </button>
      </div>
    </section>
  );
}
