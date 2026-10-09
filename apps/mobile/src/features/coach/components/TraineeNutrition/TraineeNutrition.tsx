import { useCallback } from 'react';
import { sharedCopy, useCopy, useLoad } from '@sistem/shared';
import { IconInfoCircle } from '@tabler/icons-react';
import { getNutritionPlan } from '../../../../services/coach/coachService';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { NutritionPlanView } from '../../../nutrition/components/NutritionPlanView/NutritionPlanView';
import { nutritionCopy } from '../../../nutrition/copy';
import { coachCopy } from '../../copy';
import './TraineeNutrition.css';

/**
 * Coach mode, read-only (PRD §5.6): the version the trainee sees now. Building and editing
 * happen on the web dashboard.
 */
export function TraineeNutrition({ traineeId }: { traineeId: string }) {
  const copy = useCopy(nutritionCopy);
  const coachText = useCopy(coachCopy);
  const shared = useCopy(sharedCopy);
  const load = useCallback(() => getNutritionPlan(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, coachText.nutritionLoadError);

  if (isLoading && !data) return <StateMessage>{shared.common.loading}</StateMessage>;
  if (!data) return <StateMessage onRetry={reload}>{error}</StateMessage>;

  return (
    <div className="coach-trainee-nutrition">
      <p className="coach-trainee-nutrition-hint">
        <IconInfoCircle size={18} aria-hidden="true" />
        <span>{copy.coachEditHint}</span>
      </p>
      {data.plan?.changedSincePublish && data.published && (
        <p className="coach-trainee-nutrition-note">{copy.coachUnpublished}</p>
      )}
      {data.published ? <NutritionPlanView plan={data.published} /> : <StateMessage>{copy.coachEmpty}</StateMessage>}
    </div>
  );
}
