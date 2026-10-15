import { sharedCopy, useCopy } from '@sistem/shared';
import { nutritionBuilderPath } from '../../../../app/config/routes';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { useTraineeNutrition } from '../../hooks/useTraineeNutrition';
import { CurrentNutritionPlanCard } from '../CurrentNutritionPlanCard/CurrentNutritionPlanCard';
import { NutritionEmptyState } from '../NutritionEmptyState/NutritionEmptyState';
import { NutritionPreferencesCard } from '../NutritionPreferencesCard/NutritionPreferencesCard';
import { PortionTrackingCard } from '../PortionTrackingCard/PortionTrackingCard';
import './TraineeNutritionTab.css';

/**
 * The trainee page's Nutrition tab: a summary of her plan (or an empty state built from her
 * preferences) that sends the coach to the nutrition builder, her questionnaire preferences, and
 * her portion tracking once a plan is published (13a+).
 */
export function TraineeNutritionTab({ traineeId }: { traineeId: string }) {
  const shared = useCopy(sharedCopy);
  const { data, error, isLoading, reload, hasAiDraft } = useTraineeNutrition(traineeId);
  const builderPath = nutritionBuilderPath(traineeId);

  if (isLoading && !data) return <p className="trainee-nutrition-note">{shared.common.loading}</p>;
  if (!data) {
    return (
      <p className="trainee-nutrition-note" role="alert">
        {error}{' '}
        <PillButton size="sm" onClick={reload}>
          {shared.common.retry}
        </PillButton>
      </p>
    );
  }

  return (
    <div className="trainee-nutrition">
      {data.plan ? (
        <CurrentNutritionPlanCard plan={data.plan} config={data.config} builderPath={builderPath} />
      ) : (
        <NutritionEmptyState preferences={data.preferences} builderPath={builderPath} hasAiDraft={hasAiDraft} />
      )}
      <div className="trainee-nutrition-side">
        <NutritionPreferencesCard preferences={data.preferences} />
      </div>
      {data.published && (
        <div className="trainee-nutrition-tracking">
          <PortionTrackingCard traineeId={traineeId} />
        </div>
      )}
    </div>
  );
}
