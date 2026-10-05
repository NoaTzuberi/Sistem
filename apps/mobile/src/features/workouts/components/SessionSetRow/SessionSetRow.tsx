import type { SessionSet, SetValues } from '../../data/sessionSets';
import { DURATION_STEP_SEC, MAX_DURATION_SEC, MAX_REPS, MAX_WEIGHT_KG, REPS_STEP } from '../../data/sessionConfig';
import { SESSION_COPY, formatClock } from '../../data/workoutCopy';
import { NumberStepper } from '../NumberStepper/NumberStepper';
import './SessionSetRow.css';

interface SessionSetRowProps {
  set: SessionSet;
  values: SetValues;
  /** 'W', 'D' or the working set's number. */
  tag: string;
  /** The next set to do — outlined. */
  isCurrent: boolean;
  weightStep: number;
  showWeight: boolean;
  /** Milliseconds left on this set's running hold, or null. */
  holdRemainingMs: number | null;
  /** The row's own ▶ countdown (off in an interval block, which has its own timer). */
  allowHold: boolean;
  onEdit: (patch: Partial<Omit<SetValues, 'completed'>>) => void;
  onToggle: () => void;
  onStartHold: () => void;
  onStopHold: () => void;
}

/** One set: kg and reps (or seconds for a hold), and the big ✓ under the thumb. */
export function SessionSetRow({
  set,
  values,
  tag,
  isCurrent,
  weightStep,
  showWeight,
  holdRemainingMs,
  allowHold,
  onEdit,
  onToggle,
  onStartHold,
  onStopHold,
}: SessionSetRowProps) {
  const setLabel = tag || String(set.setIndex + 1);
  const isHolding = holdRemainingMs !== null;
  const classNames = ['session-set', isCurrent && 'session-set-current', values.completed && 'session-set-done']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} id={`session-set-${set.key}`}>
      <div className="session-set-row">
        <span className="session-set-tag" aria-label={`Set ${setLabel}`}>
          {tag}
        </span>

        {showWeight ? (
          <NumberStepper
            value={values.weight}
            step={weightStep}
            max={MAX_WEIGHT_KG}
            decimal
            label={`${SESSION_COPY.columnKg}, set ${setLabel}`}
            onChange={(weight) => onEdit({ weight })}
          />
        ) : (
          <span aria-hidden="true" />
        )}

        {set.timed ? (
          <NumberStepper
            value={values.durationSec}
            step={DURATION_STEP_SEC}
            max={MAX_DURATION_SEC}
            label={`${SESSION_COPY.columnSec}, set ${setLabel}`}
            onChange={(durationSec) => onEdit({ durationSec })}
          />
        ) : (
          <NumberStepper
            value={values.reps}
            step={REPS_STEP}
            max={MAX_REPS}
            label={`${SESSION_COPY.columnReps}, set ${setLabel}`}
            onChange={(reps) => onEdit({ reps })}
          />
        )}

        <button
          type="button"
          className="session-set-check"
          aria-pressed={values.completed}
          aria-label={values.completed ? SESSION_COPY.markNotDone(setLabel) : SESSION_COPY.markDone(setLabel)}
          onClick={onToggle}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </button>
      </div>

      {set.timed && allowHold && !values.completed && (
        <button
          type="button"
          className={isHolding ? 'session-set-hold session-set-hold-running' : 'session-set-hold'}
          onClick={isHolding ? onStopHold : onStartHold}
          disabled={!isHolding && !values.durationSec}
        >
          {isHolding
            ? `${formatClock(Math.ceil(holdRemainingMs / 1000))} · ${SESSION_COPY.stopHold}`
            : `▶ ${SESSION_COPY.startHold(formatClock(values.durationSec ?? 0))}`}
        </button>
      )}
    </div>
  );
}
