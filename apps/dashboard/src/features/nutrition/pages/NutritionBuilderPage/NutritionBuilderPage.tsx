import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sharedCopy, useCopy, useLoad } from '@sistem/shared';
import { getNutritionPlan, getTrainee, listNutritionTemplates } from '../../../../services/coach/coachService';
import { traineePath } from '../../../../app/config/routes';
import { Button } from '../../../../components/common/Button/Button';
import { NutritionEditor } from '../../components/NutritionEditor/NutritionEditor';
import { nutritionCopy } from '../../copy';

/** Loads her nutrition plan (or none yet), her name and the coach's templates. */
export function NutritionBuilderPage() {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  const { traineeId = '' } = useParams();
  const load = useCallback(async () => {
    const [nutrition, { trainee }, templates] = await Promise.all([
      getNutritionPlan(traineeId),
      getTrainee(traineeId),
      listNutritionTemplates(),
    ]);
    return { nutrition, trainee, templates };
  }, [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, copy.loadError);

  if (!data) {
    return (
      <div>
        <Link to={traineePath(traineeId, 'nutrition')}>{copy.backToTrainee}</Link>
        {isLoading && <p>{shared.common.loading}</p>}
        {error && (
          <p role="alert">
            {error} <Button size="sm" onClick={reload}>{shared.common.retry}</Button>
          </p>
        )}
      </div>
    );
  }

  return (
    <NutritionEditor
      key={traineeId}
      traineeId={traineeId}
      traineeName={data.trainee.name}
      initial={data.nutrition}
      templates={data.templates}
    />
  );
}
