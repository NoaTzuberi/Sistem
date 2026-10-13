import { useCallback } from 'react';
import { useLoad } from '@sistem/shared';
import { listTraineeBodyMetrics } from '../../../services/coach/coachService';

// useLoad wants a message; a weigh-in that could not be loaded just leaves the goal bar at its start.
const FAILED = 'failed';

/**
 * Her newest weigh-in in kg — what the weight-goal bar measures against. Only asked for when
 * there is a goal to draw (`enabled`); undefined while loading, without weigh-ins, or on failure.
 */
export function useLatestWeight(traineeId: string, enabled: boolean): number | undefined {
  const load = useCallback(async () => (enabled ? (await listTraineeBodyMetrics(traineeId)).items : []), [traineeId, enabled]);
  const { data } = useLoad(load, FAILED);
  // The list is newest day first.
  return data?.find((day) => day.weight !== undefined)?.weight;
}
