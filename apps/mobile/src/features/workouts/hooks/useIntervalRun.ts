import { useCallback, useEffect, useRef, useState } from 'react';
import {
  advanceRun,
  markWorkDone,
  pauseRun,
  remainingMs,
  resumeRun,
  skipPhase,
  startRun,
} from '../data/intervalTimeline';
import type { IntervalPhase, IntervalRun } from '../data/intervalTimeline';
import { beep, isCountdownBeep, unlockAudio } from '../data/intervalSounds';
import { useSoundMuted } from './useSoundMuted';

const TICK_MS = 100;
/** A gap this long between ticks means the page was away (frozen, throttled, asleep). */
const AWAY_GAP_MS = 3000;

interface UseIntervalRunOptions {
  /** Where the run is kept on the phone, so it survives a closed app. */
  storageKey: string;
  /** Off until the screen around it is ready (the session's sets are loaded). */
  enabled: boolean;
  /**
   * Session runs log a set per finished work period. Without it (the free timer)
   * nothing is logged and nothing is asked after being away.
   */
  onWorkDone?: (phase: IntervalPhase) => void;
}

function loadRun(key: string): IntervalRun | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as IntervalRun) : null;
  } catch {
    return null;
  }
}

function saveRun(key: string, run: IntervalRun | null): void {
  try {
    if (run) localStorage.setItem(key, JSON.stringify(run));
    else localStorage.removeItem(key);
  } catch {
    // Storage unavailable: the run still works while the app stays open.
  }
}

/**
 * Runs an interval timer hands-free: work → rest → next, with beeps at 10 s and
 * 3-2-1 and a long beep when the phase switches. While the page is visible, each
 * work period that ends is logged at once. After being away (backgrounded, locked,
 * app closed), nothing is logged on her behalf: the run pauses at the current point
 * in time and `catchUp` asks whether she did the work periods that ended meanwhile.
 */
export function useIntervalRun({ storageKey, enabled, onWorkDone }: UseIntervalRunOptions) {
  const [run, setRunState] = useState<IntervalRun | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [muted] = useSoundMuted();

  const runRef = useRef<IntervalRun | null>(null);
  const lastTickRef = useRef(Date.now());
  const beepedRef = useRef(new Set<string>());
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const onWorkDoneRef = useRef(onWorkDone);
  onWorkDoneRef.current = onWorkDone;

  const setRun = useCallback(
    (next: IntervalRun | null) => {
      runRef.current = next;
      setRunState(next);
      saveRun(storageKey, next);
    },
    [storageKey],
  );

  const logWork = useCallback((current: IntervalRun, indexes: number[]): IntervalRun => {
    const work = indexes.filter((index) => current.phases[index].kind === 'work');
    for (const index of work) onWorkDoneRef.current?.(current.phases[index]);
    return markWorkDone(current, work);
  }, []);

  /** Brings the run to `time`. `away`: she wasn't looking — ask before logging anything. */
  const process = useCallback(
    (time: number, away: boolean) => {
      const current = runRef.current;
      if (!current || current.finished || current.endsAt === null) return;
      const { run: moved, ended } = advanceRun(current, time);
      if (ended.length === 0) return;

      const endedWork = ended.filter((index) => current.phases[index].kind === 'work');
      if (away && endedWork.length > 0 && onWorkDoneRef.current) {
        // Pause at the current point in time; the sheet decides about the missed ones.
        const paused = moved.finished ? moved : pauseRun(moved, time);
        setRun({ ...paused, catchUp: [...(current.catchUp ?? []), ...endedWork] });
        return;
      }
      if (!away) beep('long', mutedRef.current);
      setRun(logWork(moved, ended));
    },
    [logWork, setRun],
  );

  // Restore a run kept on the phone (app closed mid-run): it was away the whole time.
  useEffect(() => {
    if (!enabled) return;
    const stored = loadRun(storageKey);
    if (!stored) return;
    runRef.current = stored;
    setRunState(stored);
    lastTickRef.current = Date.now();
    process(Date.now(), true);
  }, [enabled, process, storageKey]);

  // The tick: only while visible. Hidden time is caught up on return, as "away".
  useEffect(() => {
    if (!enabled || !run || run.finished || run.endsAt === null) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const time = Date.now();
      const away = time - lastTickRef.current > AWAY_GAP_MS;
      lastTickRef.current = time;
      setNow(time);
      process(time, away);

      const current = runRef.current;
      if (!current || current.endsAt === null || away) return;
      const left = Math.ceil(remainingMs(current, time) / 1000);
      const key = `${current.index}:${left}`;
      if (isCountdownBeep(left, current.phases[current.index].durationSec) && !beepedRef.current.has(key)) {
        beepedRef.current.add(key);
        beep('short', mutedRef.current);
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [enabled, process, run]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        const time = Date.now();
        lastTickRef.current = time;
        setNow(time);
        process(time, true);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [process]);

  const start = useCallback(
    (phases: IntervalPhase[]) => {
      if (phases.length === 0) return;
      unlockAudio();
      const time = Date.now();
      beepedRef.current = new Set();
      lastTickRef.current = time;
      setNow(time);
      setRun(startRun(phases, time));
    },
    [setRun],
  );

  const pause = useCallback(() => {
    if (runRef.current) setRun(pauseRun(runRef.current, Date.now()));
  }, [setRun]);

  const resume = useCallback(() => {
    if (!runRef.current) return;
    unlockAudio();
    const time = Date.now();
    lastTickRef.current = time;
    setNow(time);
    setRun(resumeRun(runRef.current, time));
  }, [setRun]);

  const skip = useCallback(() => {
    if (!runRef.current) return;
    const time = Date.now();
    setNow(time);
    setRun(skipPhase(runRef.current, time));
  }, [setRun]);

  /** "Yes, I did them" logs the work periods that ended while away; "No" leaves them not done. Then the run goes on. */
  const answerCatchUp = useCallback(
    (didThem: boolean) => {
      const current = runRef.current;
      if (!current?.catchUp) return;
      const answered = { ...(didThem ? logWork(current, current.catchUp) : current), catchUp: undefined };
      unlockAudio();
      const time = Date.now();
      lastTickRef.current = time;
      setNow(time);
      setRun(answered.finished ? answered : resumeRun(answered, time));
    },
    [logWork, setRun],
  );

  /** Stop (or close the "done" screen): the run is forgotten; logged sets stay done. */
  const close = useCallback(() => {
    setRun(null);
  }, [setRun]);


  return {
    run,
    remainingMs: run ? remainingMs(run, now) : 0,
    catchUpCount: run?.catchUp?.length ?? 0,
    start,
    pause,
    resume,
    skip,
    answerCatchUp,
    close,
  };
}
