import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { traineePath } from '../../../app/config/routes';
import type { TraineeTab } from '../../../app/config/routes';

interface TraineeDrawerValue {
  /** The trainee the quick view shows, or null while it is closed. */
  openTraineeId: string | null;
  openDrawer: (traineeId: string) => void;
  closeDrawer: () => void;
  /** Her full profile, on one tab (the overview tab without one); `state` = router state for that page. The drawer closes on the way. */
  openProfile: (traineeId: string, tab?: TraineeTab, state?: unknown) => void;
}

const TraineeDrawerContext = createContext<TraineeDrawerValue | undefined>(undefined);

/**
 * The trainee quick view opens from many places (a table row, the week board, the waiting
 * card, ⌘K) and lives once in the shell. Closing gives the focus back to what opened it.
 */
export function TraineeDrawerProvider({ children }: { children: ReactNode }) {
  const [openTraineeId, setOpenTraineeId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  const openDrawer = useCallback((traineeId: string) => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpenTraineeId(traineeId);
  }, []);

  const closeDrawer = useCallback(() => {
    setOpenTraineeId(null);
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger?.isConnected) trigger.focus();
  }, []);

  const openProfile = useCallback(
    (traineeId: string, tab?: TraineeTab, state?: unknown) => {
      // The focus belongs to the new page, not to the row that opened the drawer.
      triggerRef.current = null;
      setOpenTraineeId(null);
      navigate(traineePath(traineeId, tab), state === undefined ? undefined : { state });
    },
    [navigate],
  );

  // A link inside the drawer went somewhere: the quick view is done (the focus belongs to the new page).
  useEffect(() => {
    triggerRef.current = null;
    setOpenTraineeId(null);
  }, [pathname, search]);

  const value = useMemo(() => ({ openTraineeId, openDrawer, closeDrawer, openProfile }), [openTraineeId, openDrawer, closeDrawer, openProfile]);
  return <TraineeDrawerContext.Provider value={value}>{children}</TraineeDrawerContext.Provider>;
}

export function useTraineeDrawer(): TraineeDrawerValue {
  const context = useContext(TraineeDrawerContext);
  if (!context) {
    throw new Error('useTraineeDrawer must be used within a TraineeDrawerProvider.');
  }
  return context;
}
