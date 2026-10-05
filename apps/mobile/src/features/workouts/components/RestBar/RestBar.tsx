import { REST_ADJUST_SEC } from '../../data/sessionConfig';
import { SESSION_COPY, formatClock } from '../../data/workoutCopy';
import { CountdownBar } from '../CountdownBar/CountdownBar';
import './RestBar.css';

interface RestBarProps {
  /** Device clock (ms) when the rest ends — the line is drawn from it every frame. */
  endsAt: number;
  /** For the number, which updates on its own slower tick. */
  remainingMs: number;
  totalSec: number;
  onAdjust: (deltaSec: number) => void;
  onSkip: () => void;
}

/** The rest countdown in the sticky bottom bar: −15s / +15s / Skip. */
export function RestBar({ endsAt, remainingMs, totalSec, onAdjust, onSkip }: RestBarProps) {
  return (
    <div className="rest-bar" role="timer" aria-live="off">
      <CountdownBar
        className="rest-bar-progress"
        endsAt={endsAt}
        pausedRemainingMs={null}
        durationMs={totalSec * 1000}
        direction="drain"
      />
      <span className="rest-bar-label">{SESSION_COPY.rest}</span>
      <span className="rest-bar-time">{formatClock(Math.ceil(remainingMs / 1000))}</span>
      <button type="button" className="rest-bar-button" onClick={() => onAdjust(-REST_ADJUST_SEC)}>
        {SESSION_COPY.restLess(REST_ADJUST_SEC)}
      </button>
      <button type="button" className="rest-bar-button" onClick={() => onAdjust(REST_ADJUST_SEC)}>
        {SESSION_COPY.restMore(REST_ADJUST_SEC)}
      </button>
      <button type="button" className="rest-bar-button rest-bar-skip" onClick={onSkip}>
        {SESSION_COPY.restSkip}
      </button>
    </div>
  );
}
