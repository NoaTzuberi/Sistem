import { useCallback } from 'react';
import { getActiveLanguage, useLoad } from '@sistem/shared';
import { listPlans } from '../../../services/coach/coachService';
import { traineesCopy } from '../copy';

/**
 * A trainee's plans, newest first. Loaded by her page (not by the Plans tab), so the tab's
 * count is known before the tab is opened.
 */
export function useTraineePlans(traineeId: string) {
  const load = useCallback(() => listPlans(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, traineesCopy[getActiveLanguage()].plansLoadError);
  return { plans: data, error, isLoading: isLoading && !data, reload };
}

export type TraineePlansLoad = ReturnType<typeof useTraineePlans>;
