import { useState } from 'react';
import type { FoodGroup, NutritionPlanView as PlanView } from '@sistem/types';
import { formatDateTime } from '@sistem/shared';
import { MealCard } from '../MealCard/MealCard';
import { SwapSheet } from '../SwapSheet/SwapSheet';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './NutritionPlanView.css';

interface OpenSwaps {
  group: FoodGroup;
  foodId?: string;
}

/**
 * A published nutrition plan as she sees it — meals with portions per group, the coach's
 * options and tips, and the swap sheet. Also used read-only by coach mode. No calories.
 */
export function NutritionPlanView({ plan }: { plan: PlanView }) {
  const [open, setOpen] = useState<OpenSwaps | null>(null);

  return (
    <div className="nutrition-plan">
      <p className="nutrition-plan-updated">
        {NUTRITION_COPY.updated} {formatDateTime(plan.publishedAt)}
      </p>

      {plan.meals.map((meal) => (
        <MealCard
          key={meal.id}
          meal={meal}
          hasVegetableSwaps={plan.swaps.vegetable.length > 0}
          onOpenSwaps={(group, foodId) => setOpen({ group, foodId })}
        />
      ))}

      {plan.tips.length > 0 && (
        <section className="nutrition-plan-tips" aria-labelledby="nutrition-plan-tips-title">
          <h2 className="nutrition-plan-tips-title" id="nutrition-plan-tips-title">
            {NUTRITION_COPY.tipsTitle}
          </h2>
          <ul className="nutrition-plan-tips-list">
            {plan.tips.map((tip, index) => (
              <li key={index} dir="auto">
                {tip}
              </li>
            ))}
          </ul>
        </section>
      )}

      <SwapSheet group={open?.group ?? null} currentFoodId={open?.foodId} swaps={plan.swaps} onClose={() => setOpen(null)} />
    </div>
  );
}
