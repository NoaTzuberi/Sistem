import { useCallback } from 'react';
import { getActiveLanguage, useLoad } from '@sistem/shared';
import { listTraineeBodyMetrics } from '../../../services/coach/coachService';
import { traineesCopy } from '../copy';

/** A trainee's body days (newest first) and the measurement list, for the Body tab. */
export function useBodyMetrics(traineeId: string) {
  const load = useCallback(() => listTraineeBodyMetrics(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, traineesCopy[getActiveLanguage()].bodyLoadError);
  return { list: data, error, isLoading, reload };
}
