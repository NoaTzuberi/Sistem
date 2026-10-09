import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { describeMealPortions, fill, formatDateTime, formatKcal, sharedCopy, useCopy, useLanguage, useLoad } from '@sistem/shared';
import { getNutritionPlan } from '../../../../services/coach/coachService';
import { nutritionBuilderPath } from '../../../../app/config/routes';
import { Button } from '../../../../components/common/Button/Button';
import { Badge } from '../../../../components/common/Badge/Badge';
import { PreferencesPanel } from '../PreferencesPanel/PreferencesPanel';
import { TrackingWeek } from '../TrackingWeek/TrackingWeek';
import { nutritionCopy } from '../../copy';
import './TraineeNutritionTab.css';

/** The trainee page's Nutrition tab: where her plan stands, the way into the builder, and her portion tracking (13a+). */
export function TraineeNutritionTab({ traineeId }: { traineeId: string }) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  const load = useCallback(() => getNutritionPlan(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, copy.loadError);

  if (isLoading && !data) return <p className="trainee-nutrition-note">{shared.common.loading}</p>;
  if (!data) {
    return (
      <p role="alert">
        {error} <Button size="sm" onClick={reload}>{shared.common.retry}</Button>
      </p>
    );
  }

  const plan = data.plan;
  return (
    <div className="trainee-nutrition">
      <div className="trainee-nutrition-main">
        <h2 className="trainee-nutrition-title">{copy.tabTitle}</h2>
        {plan ? (
          <>
            <p className="trainee-nutrition-status">
              {plan.publishedVersion > 0 && plan.publishedAt
                ? fill(copy.statusPublished, { version: plan.publishedVersion, date: formatDateTime(plan.publishedAt, language) })
                : copy.statusNever}{' '}
              {plan.publishedVersion > 0 && plan.changedSincePublish && <Badge tone="accent">{copy.statusChanged}</Badge>}
            </p>
            {plan.calorieTarget.kcal !== null && (
              <p className="trainee-nutrition-status">
                {copy.targetTitle}: <strong>{formatKcal(plan.calorieTarget.kcal, language)}</strong> · {copy.dayTotal}{' '}
                {formatKcal(plan.kcal.day, language)}
              </p>
            )}
            <ul className="trainee-nutrition-meals">
              {plan.meals.map((meal) => (
                <li key={meal.id}>
                  <strong dir="auto">{meal.name}</strong> — {describeMealPortions(meal.portions, meal.vegetablesFree, language)}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="trainee-nutrition-note">{copy.tabEmpty}</p>
        )}
        <Link className="button button-primary button-md trainee-nutrition-open" to={nutritionBuilderPath(traineeId)}>
          {copy.openBuilder}
        </Link>
      </div>
      <PreferencesPanel preferences={data.preferences} />
      {data.published && (
        <div className="trainee-nutrition-tracking">
          <TrackingWeek traineeId={traineeId} />
        </div>
      )}
    </div>
  );
}
