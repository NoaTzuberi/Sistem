import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface TraineeDrawerValue {
  /** The trainee the quick view shows, or null while it is closed. */
  openTraineeId: string | null;
  openDrawer: (traineeId: string) => void;
  closeDrawer: () => void;
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

  // A link inside the drawer went somewhere: the quick view is done (the focus belongs to the new page).
  useEffect(() => {
    triggerRef.current = null;
    setOpenTraineeId(null);
  }, [pathname, search]);

  const value = useMemo(() => ({ openTraineeId, openDrawer, closeDrawer }), [openTraineeId, openDrawer, closeDrawer]);
  return <TraineeDrawerContext.Provider value={value}>{children}</TraineeDrawerContext.Provider>;
}

export function useTraineeDrawer(): TraineeDrawerValue {
  const context = useContext(TraineeDrawerContext);
  if (!context) {
    throw new Error('useTraineeDrawer must be used within a TraineeDrawerProvider.');
  }
  return context;
}
