import { useEffect, useState } from 'react';
import { formatClock } from '../../data/workoutCopy';
import './SessionClock.css';

interface SessionClockProps {
  /** Server time the session started. */
  startedAt: string;
  /** server clock − device clock, measured when the session loaded. */
  serverOffsetMs: number;
}

/** Time since the workout started, on the server's clock (PRD §11). Its own component so only it re-renders every second. */
export function SessionClock({ startedAt, serverOffsetMs }: SessionClockProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsedSec = (now + serverOffsetMs - new Date(startedAt).getTime()) / 1000;
  return <span className="session-clock">{formatClock(elapsedSec)}</span>;
}
