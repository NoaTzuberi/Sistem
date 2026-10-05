import { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDuration } from '@sistem/shared';
import { Button } from '../../../../components/common/Button/Button';
import { Modal } from '../../../../components/common/Modal/Modal';
import { countRoundsDone, nextWork } from '../../data/intervalTimeline';
import { unlockAudio } from '../../data/intervalSounds';
import type { IntervalRun } from '../../data/intervalTimeline';
import { INTERVAL_COPY, formatClock } from '../../data/workoutCopy';
import { CountdownBar } from '../CountdownBar/CountdownBar';
import { SoundToggle } from '../SoundToggle/SoundToggle';
import './IntervalTimer.css';

interface IntervalTimerProps {
  run: IntervalRun;
  remainingMs: number;
  /** Work periods that ended while she was away, waiting for her answer (0 = none). */
  catchUpCount: number;
  /** The label of the button on the "done" screen. */
  doneLabel: string;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onAnswerCatchUp: (didThem: boolean) => void;
  /** Stop mid-run, or leave the "done" screen. */
  onClose: () => void;
  /** The free timer offers "Again" on the done screen (and logs no sets). */
  onAgain?: () => void;
}

/** "Next: Rest 10s → Burpees" — what comes after the current phase. */
function describeNext(run: IntervalRun): string {
  const phase = run.phases[run.index];
  const following = run.phases[run.index + 1];
  if (!following) return INTERVAL_COPY.lastOne;
  const upcomingWork = nextWork(run, run.index);
  if (following.kind === 'rest' && phase.kind === 'work') {
    return INTERVAL_COPY.nextRestThen(formatDuration(following.durationSec), upcomingWork?.label ?? '');
  }
  return upcomingWork?.label || INTERVAL_COPY.nextWork;
}

/**
 * The interval run, full screen and hands-free (HIIT / Tabata): the phase, a huge
 * countdown, the exercise, the round and what's next. Portaled above the app so the
 * page-enter animation can't move it.
 */
export function IntervalTimer({
  run,
  remainingMs,
  catchUpCount,
  doneLabel,
  onPause,
  onResume,
  onSkip,
  onAnswerCatchUp,
  onClose,
  onAgain,
}: IntervalTimerProps) {
  const [confirmStop, setConfirmStop] = useState(false);
  const phase = run.phases[run.index];
  const isPaused = run.pausedMs !== null;
  const durationMs = phase.durationSec * 1000;
  const showDone = run.finished && catchUpCount === 0;

  const subtitle =
    phase.kind === 'work'
      ? phase.label
      : phase.kind === 'ready'
        ? phase.label && INTERVAL_COPY.first(phase.label)
        : '';

  return createPortal(
    // Any tap on the screen (re)enables sound — e.g. a run restored after the app was
    // reopened has had no Start tap.
    <div
      className={showDone ? 'interval-timer interval-timer-done' : `interval-timer interval-timer-${phase.kind}`}
      onPointerDown={unlockAudio}
    >
      <div className="interval-timer-top">
        {!showDone && (
          <button type="button" className="interval-timer-icon" aria-label={INTERVAL_COPY.stop} onClick={() => setConfirmStop(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
        <SoundToggle className="interval-timer-mute" />
      </div>

      {showDone ? (
        <div className="interval-timer-main">
          <span className="interval-timer-phase">{INTERVAL_COPY.doneTitle}</span>
          <span className="interval-timer-subtitle">
            {INTERVAL_COPY.roundsDone(countRoundsDone(run), phase.rounds)}
          </span>
          <div className="interval-timer-done-actions">
            <Button onClick={onClose}>{doneLabel}</Button>
            {onAgain && (
              <Button variant="secondary" onClick={onAgain}>
                {INTERVAL_COPY.again}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="interval-timer-main" role="timer" aria-live="off">
            <span className="interval-timer-phase">{INTERVAL_COPY.phase[phase.kind]}</span>
            <span className="interval-timer-clock">{formatClock(Math.ceil(remainingMs / 1000))}</span>
            {isPaused && <span className="interval-timer-paused">{INTERVAL_COPY.paused}</span>}
            {subtitle && <span className="interval-timer-subtitle">{subtitle}</span>}
            <span className="interval-timer-round">{INTERVAL_COPY.round(phase.round, phase.rounds)}</span>
            {/* Continuous: drawn every frame from the stored end time, not from the tick. */}
            <CountdownBar
              className="interval-timer-progress"
              endsAt={run.endsAt}
              pausedRemainingMs={run.pausedMs}
              durationMs={durationMs}
              direction="fill"
            />
            <span className="interval-timer-next">
              {INTERVAL_COPY.next} {describeNext(run)}
            </span>
          </div>

          <div className="interval-timer-controls">
            <button type="button" className="interval-timer-control" onClick={isPaused ? onResume : onPause}>
              {isPaused ? `▶ ${INTERVAL_COPY.resume}` : `❚❚ ${INTERVAL_COPY.pause}`}
            </button>
            <button type="button" className="interval-timer-control" onClick={onSkip}>
              ⏭ {INTERVAL_COPY.skip}
            </button>
          </div>
        </>
      )}

      <Modal isOpen={confirmStop} onClose={() => setConfirmStop(false)} variant="flat" title={INTERVAL_COPY.confirmStopTitle}>
        <div className="interval-timer-dialog">
          <p className="interval-timer-dialog-text">{onAgain ? INTERVAL_COPY.confirmStopFree : INTERVAL_COPY.confirmStop}</p>
          <Button
            variant="danger"
            onClick={() => {
              setConfirmStop(false);
              onClose();
            }}
          >
            {INTERVAL_COPY.stopConfirm}
          </Button>
          <Button variant="ghost" onClick={() => setConfirmStop(false)}>
            {INTERVAL_COPY.keepGoing}
          </Button>
        </div>
      </Modal>

      {/* Closing the sheet without choosing counts as "No": nothing is logged for her. */}
      <Modal isOpen={catchUpCount > 0} onClose={() => onAnswerCatchUp(false)} variant="flat" title={INTERVAL_COPY.catchUpTitle}>
        <div className="interval-timer-dialog">
          <p className="interval-timer-dialog-text">{INTERVAL_COPY.catchUp(catchUpCount)}</p>
          <Button onClick={() => onAnswerCatchUp(true)}>{INTERVAL_COPY.catchUpYes}</Button>
          <Button variant="ghost" onClick={() => onAnswerCatchUp(false)}>
            {INTERVAL_COPY.catchUpNo}
          </Button>
        </div>
      </Modal>
    </div>,
    document.body,
  );
}
