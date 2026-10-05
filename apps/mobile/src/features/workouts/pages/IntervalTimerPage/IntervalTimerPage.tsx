import { useState } from 'react';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Button } from '../../../../components/common/Button/Button';
import { useWakeLock } from '../../../../hooks/useWakeLock';
import { BackButton } from '../../components/BackButton/BackButton';
import { IntervalTimer } from '../../components/IntervalTimer/IntervalTimer';
import { buildFreePhases } from '../../data/intervalTimeline';
import { playTestSound } from '../../data/intervalSounds';
import {
  FREE_TIMER_DEFAULTS,
  FREE_TIMER_MAX_ROUNDS,
  FREE_TIMER_MAX_SEC,
  FREE_TIMER_MIN_WORK_SEC,
  FREE_TIMER_STEP_SEC,
} from '../../data/sessionConfig';
import { INTERVAL_COPY, formatClock } from '../../data/workoutCopy';
import { useIntervalRun } from '../../hooks/useIntervalRun';
import './IntervalTimerPage.css';

const SETTINGS_KEY = 'sistem.interval.free.settings';
const RUN_KEY = 'sistem.interval.free';

type Settings = typeof FREE_TIMER_DEFAULTS;

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...FREE_TIMER_DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : FREE_TIMER_DEFAULTS;
  } catch {
    return FREE_TIMER_DEFAULTS;
  }
}

function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Remembered for this visit only.
  }
}

interface SetupRowProps {
  label: string;
  value: string;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}

function SetupRow({ label, value, canDecrease, canIncrease, onDecrease, onIncrease }: SetupRowProps) {
  return (
    <div className="interval-setup-row" role="group" aria-label={label}>
      <span className="interval-setup-label">{label}</span>
      <button type="button" className="interval-setup-button" aria-label={`− ${label}`} disabled={!canDecrease} onClick={onDecrease}>
        −
      </button>
      <span className="interval-setup-value">{value}</span>
      <button type="button" className="interval-setup-button" aria-label={`+ ${label}`} disabled={!canIncrease} onClick={onIncrease}>
        +
      </button>
    </div>
  );
}

/**
 * The free interval timer (opened from Home and the session ⋯ menu): she sets work,
 * rest and rounds herself. Same screen, sounds and timing as a planned interval, but
 * it logs nothing and needs no connection.
 */
export function IntervalTimerPage() {
  const [settings, setSettings] = useState(loadSettings);
  const interval = useIntervalRun({ storageKey: RUN_KEY, enabled: true });
  useWakeLock(interval.run !== null && !interval.run.finished);

  const { workSec, restSec, rounds } = settings;
  const totalSec = workSec * rounds + restSec * Math.max(0, rounds - 1);

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  function start() {
    interval.start(buildFreePhases(workSec, restSec, rounds));
  }

  return (
    <AppShell hideTabBar>
      <div className="interval-setup">
        <header className="interval-setup-header">
          <BackButton />
          <h1 className="interval-setup-title">{INTERVAL_COPY.timerTitle}</h1>
        </header>

        <SetupRow
          label={INTERVAL_COPY.timerWork}
          value={formatClock(workSec)}
          canDecrease={workSec > FREE_TIMER_MIN_WORK_SEC}
          canIncrease={workSec < FREE_TIMER_MAX_SEC}
          onDecrease={() => update({ workSec: Math.max(FREE_TIMER_MIN_WORK_SEC, workSec - FREE_TIMER_STEP_SEC) })}
          onIncrease={() => update({ workSec: Math.min(FREE_TIMER_MAX_SEC, workSec + FREE_TIMER_STEP_SEC) })}
        />
        <SetupRow
          label={INTERVAL_COPY.timerRest}
          value={formatClock(restSec)}
          canDecrease={restSec > 0}
          canIncrease={restSec < FREE_TIMER_MAX_SEC}
          onDecrease={() => update({ restSec: Math.max(0, restSec - FREE_TIMER_STEP_SEC) })}
          onIncrease={() => update({ restSec: Math.min(FREE_TIMER_MAX_SEC, restSec + FREE_TIMER_STEP_SEC) })}
        />
        <SetupRow
          label={INTERVAL_COPY.timerRounds}
          value={String(rounds)}
          canDecrease={rounds > 1}
          canIncrease={rounds < FREE_TIMER_MAX_ROUNDS}
          onDecrease={() => update({ rounds: Math.max(1, rounds - 1) })}
          onIncrease={() => update({ rounds: Math.min(FREE_TIMER_MAX_ROUNDS, rounds + 1) })}
        />

        <p className="interval-setup-total">{INTERVAL_COPY.timerTotal(formatClock(totalSec))}</p>

        <Button className="interval-setup-start" onClick={start}>
          {INTERVAL_COPY.timerStart}
        </Button>

        {/* Dev only: checks the beeps without running a timer. Not in production builds. */}
        {import.meta.env.DEV && (
          <Button variant="ghost" onClick={playTestSound}>
            Test sound (dev)
          </Button>
        )}
      </div>

      {interval.run && (
        <IntervalTimer
          run={interval.run}
          remainingMs={interval.remainingMs}
          catchUpCount={interval.catchUpCount}
          doneLabel={INTERVAL_COPY.close}
          onPause={interval.pause}
          onResume={interval.resume}
          onSkip={interval.skip}
          onAnswerCatchUp={interval.answerCatchUp}
          onClose={interval.close}
          onAgain={start}
        />
      )}
    </AppShell>
  );
}
