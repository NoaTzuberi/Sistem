import { useCallback } from 'react';
import type { CoachStats, CoachStatsRange } from '@sistem/types';
import { useLoad } from '@sistem/shared';
import { getCoachStats } from '../../../services/coach/coachService';

// useLoad wants a message; the page words the failure itself.
const FAILED = 'failed';

/** The Statistics numbers for a range. A new range keeps the old numbers on screen until it arrives. */
export function useStats(range: CoachStatsRange): { stats: CoachStats | undefined; hasError: boolean; isLoading: boolean; reload: () => void } {
  const load = useCallback(() => getCoachStats(range), [range]);
  const { data, error, isLoading, reload } = useLoad(load, FAILED);
  return { stats: data, hasError: error !== undefined, isLoading, reload };
}
