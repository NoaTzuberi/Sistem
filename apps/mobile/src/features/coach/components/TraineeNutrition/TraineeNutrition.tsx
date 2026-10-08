import { useCallback } from 'react';
import { useLoad } from '@sistem/shared';
import { IconInfoCircle } from '@tabler/icons-react';
import { getNutritionPlan } from '../../../../services/coach/coachService';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { NutritionPlanView } from '../../../nutrition/components/NutritionPlanView/NutritionPlanView';
import { NUTRITION_COPY } from '../../../nutrition/data/nutritionCopy';
import './TraineeNutrition.css';

/**
 * Coach mode, read-only (PRD §5.6): the version the trainee sees now. Building and editing
 * happen on the web dashboard.
 */
export function TraineeNutrition({ traineeId }: { traineeId: string }) {
  const load = useCallback(() => getNutritionPlan(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, "Couldn't load the nutrition plan.");

  if (isLoading && !data) return <StateMessage>Loading…</StateMessage>;
  if (!data) return <StateMessage onRetry={reload}>{error}</StateMessage>;

  return (
    <div className="coach-trainee-nutrition">
      <p className="coach-trainee-nutrition-hint">
        <IconInfoCircle size={18} aria-hidden="true" />
        <span>{NUTRITION_COPY.coachEditHint}</span>
      </p>
      {data.plan?.changedSincePublish && data.published && (
        <p className="coach-trainee-nutrition-note">{NUTRITION_COPY.coachUnpublished}</p>
      )}
      {data.published ? <NutritionPlanView plan={data.published} /> : <StateMessage>{NUTRITION_COPY.coachEmpty}</StateMessage>}
    </div>
  );
}
