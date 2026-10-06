import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { ActiveWorkoutConflictBody, ActiveWorkoutRef } from '@sistem/types';
import { extractErrorMessage } from '@sistem/api-client';
import { abandonWorkout, startWorkout } from '../../../services/workoutLogs/workoutLogsService';
import { workoutSessionPath } from '../../../app/config/routes';
import { clearCachedSession } from '../data/sessionCache';
import { SESSION_COPY } from '../data/workoutCopy';

interface Conflict {
  active: ActiveWorkoutRef;
  planId: string;
  workoutId: string;
}

function conflictOf(error: unknown): ActiveWorkoutRef | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 409) return null;
  const body = error.response.data as Partial<ActiveWorkoutConflictBody> | undefined;
  return body?.code === 'other_workout_active' && body.activeLog ? body.activeLog : null;
}

/**
 * One tap from Home or a workout's page: starts the workout (or resumes it) and opens
 * the session. If another workout is still open, `conflict` asks her to resume it or
 * discard it first — only one workout can be open at a time.
 */
export function useStartWorkout() {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<Conflict | null>(null);

  async function start(planId: string, workoutId: string) {
    setIsStarting(true);
    setError(null);
    try {
      const { session, resumed } = await startWorkout(planId, workoutId);
      // A fresh start shows the Focus / Do Not Disturb tip once; a resume doesn't.
      navigate(workoutSessionPath(session.log.id), { state: { justStarted: !resumed } });
    } catch (caught) {
      const active = conflictOf(caught);
      if (active) setConflict({ active, planId, workoutId });
      else if (axios.isAxiosError(caught) && !caught.response) setError(SESSION_COPY.startOffline);
      else setError(extractErrorMessage(caught, SESSION_COPY.startError));
    } finally {
      setIsStarting(false);
    }
  }

  function resumeActive() {
    if (conflict) navigate(workoutSessionPath(conflict.active.logId));
  }

  async function discardActiveAndStart() {
    if (!conflict) return;
    setIsStarting(true);
    try {
      await abandonWorkout(conflict.active.logId);
      clearCachedSession(conflict.active.logId);
    } catch (caught) {
      // Already finished / discarded elsewhere (409) is fine: start anyway.
      if (!axios.isAxiosError(caught) || caught.response?.status !== 409) {
        setIsStarting(false);
        setError(extractErrorMessage(caught, SESSION_COPY.discardError));
        return;
      }
    }
    const { planId, workoutId } = conflict;
    setConflict(null);
    await start(planId, workoutId);
  }

  return {
    start,
    isStarting,
    error,
    conflict: conflict?.active ?? null,
    closeConflict: () => setConflict(null),
    resumeActive,
    discardActiveAndStart,
  };
}
