import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { describeMealPortions, formatDateTime, formatKcal, useLoad } from '@sistem/shared';
import { getNutritionPlan } from '../../../../services/coach/coachService';
import { nutritionBuilderPath } from '../../../../app/config/routes';
import { Button } from '../../../../components/common/Button/Button';
import { Badge } from '../../../../components/common/Badge/Badge';
import { PreferencesPanel } from '../PreferencesPanel/PreferencesPanel';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './TraineeNutritionTab.css';

/** The trainee page's Nutrition tab: where her plan stands, and the way into the builder. */
export function TraineeNutritionTab({ traineeId }: { traineeId: string }) {
  const load = useCallback(() => getNutritionPlan(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, NUTRITION_COPY.loadError);

  if (isLoading && !data) return <p className="trainee-nutrition-note">Loading…</p>;
  if (!data) {
    return (
      <p role="alert">
        {error} <Button size="sm" onClick={reload}>Try again</Button>
      </p>
    );
  }

  const plan = data.plan;
  return (
    <div className="trainee-nutrition">
      <div className="trainee-nutrition-main">
        <h2 className="trainee-nutrition-title">{NUTRITION_COPY.tabTitle}</h2>
        {plan ? (
          <>
            <p className="trainee-nutrition-status">
              {plan.publishedVersion > 0 && plan.publishedAt
                ? NUTRITION_COPY.statusPublished(plan.publishedVersion, formatDateTime(plan.publishedAt))
                : NUTRITION_COPY.statusNever}{' '}
              {plan.publishedVersion > 0 && plan.changedSincePublish && <Badge tone="accent">{NUTRITION_COPY.statusChanged}</Badge>}
            </p>
            {plan.calorieTarget.kcal !== null && (
              <p className="trainee-nutrition-status">
                {NUTRITION_COPY.targetTitle}: <strong>{formatKcal(plan.calorieTarget.kcal)}</strong> · {NUTRITION_COPY.dayTotal}{' '}
                {formatKcal(plan.kcal.day)}
              </p>
            )}
            <ul className="trainee-nutrition-meals">
              {plan.meals.map((meal) => (
                <li key={meal.id}>
                  <strong dir="auto">{meal.name}</strong> — {describeMealPortions(meal.portions, meal.vegetablesFree)}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="trainee-nutrition-note">{NUTRITION_COPY.tabEmpty}</p>
        )}
        <Link className="button button-primary button-md trainee-nutrition-open" to={nutritionBuilderPath(traineeId)}>
          {NUTRITION_COPY.openBuilder}
        </Link>
      </div>
      <PreferencesPanel preferences={data.preferences} />
    </div>
  );
}
