import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { CoachStats, CoachTraineeSummary, CoachTraineeWeek } from '@sistem/types';
import { sortByUrgency, useLoad, useServerNow } from '@sistem/shared';
import { getCoachStats, listTrainees } from './coachService';

interface CoachDataValue {
  /** Her trainees, most urgent first. Empty until the first load. */
  trainees: CoachTraineeSummary[];
  hasTrainees: boolean;
  hasTraineesError: boolean;
  /** "Now" on the server's clock — the 48h countdowns count against it. */
  nowMs: number;
  /** The overview numbers (default range); undefined until loaded. */
  stats: CoachStats | undefined;
  hasStatsError: boolean;
  weekOf: (traineeId: string) => CoachTraineeWeek | undefined;
  reload: () => void;
}

const CoachDataContext = createContext<CoachDataValue | undefined>(undefined);

// useLoad wants a message; each screen words the failure itself, so only the fact is kept.
const FAILED = 'failed';
const loadStats = () => getCoachStats();

/**
 * The data every part of the shell reads: the sidebar badges, the ⌘K palette, the trainee
 * drawer, the Overview and the trainees table. Loaded once, and again on every page change
 * (the old data stays on screen meanwhile).
 */
export function CoachDataProvider({ children }: { children: ReactNode }) {
  const traineesLoad = useLoad(listTrainees, FAILED);
  const statsLoad = useLoad(loadStats, FAILED);
  const nowMs = useServerNow(traineesLoad.data?.serverTime);
  const { pathname } = useLocation();

  const reloadTrainees = traineesLoad.reload;
  const reloadStats = statsLoad.reload;
  const reload = useCallback(() => {
    reloadTrainees();
    reloadStats();
  }, [reloadTrainees, reloadStats]);

  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    reload();
  }, [pathname, reload]);

  const value = useMemo<CoachDataValue>(() => {
    const weeks = new Map(statsLoad.data?.trainees.map((week) => [week.traineeId, week]));
    return {
      trainees: sortByUrgency(traineesLoad.data?.items ?? []),
      hasTrainees: traineesLoad.data !== undefined,
      hasTraineesError: traineesLoad.error !== undefined,
      nowMs,
      stats: statsLoad.data,
      hasStatsError: statsLoad.error !== undefined,
      weekOf: (traineeId) => weeks.get(traineeId),
      reload,
    };
  }, [traineesLoad.data, traineesLoad.error, statsLoad.data, statsLoad.error, nowMs, reload]);

  return <CoachDataContext.Provider value={value}>{children}</CoachDataContext.Provider>;
}

export function useCoachData(): CoachDataValue {
  const context = useContext(CoachDataContext);
  if (!context) {
    throw new Error('useCoachData must be used within a CoachDataProvider.');
  }
  return context;
}
