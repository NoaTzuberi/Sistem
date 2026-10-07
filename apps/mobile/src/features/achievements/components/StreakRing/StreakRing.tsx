import { useEffect, useState } from 'react';
import type { StreakSummary } from '@sistem/types';
import { streakWeekFraction } from '@sistem/shared';
import { IconFlame } from '@tabler/icons-react';
import './StreakRing.css';

interface StreakRingProps {
  streak: StreakSummary;
  size?: 'compact' | 'large';
}

const VIEW = 64;
const STROKE = 5;
const RADIUS = (VIEW - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The weekly streak (Phase 11): the number of weeks in the middle, the ring filled with
 * this week's done / planned workouts. Every value comes from the server.
 */
export function StreakRing({ streak, size = 'compact' }: StreakRingProps) {
  const target = streakWeekFraction(streak);
  // Sweeps in from empty (the CSS transition), and again on any later change.
  const [fraction, setFraction] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFraction(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <span className={`streak-ring streak-ring-${size}`} aria-hidden="true">
      <svg className="streak-ring-svg" viewBox={`0 0 ${VIEW} ${VIEW}`}>
        <circle className="streak-ring-track" cx={VIEW / 2} cy={VIEW / 2} r={RADIUS} strokeWidth={STROKE} fill="none" />
        <circle
          className="streak-ring-fill"
          cx={VIEW / 2}
          cy={VIEW / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          transform={`rotate(-90 ${VIEW / 2} ${VIEW / 2})`}
        />
      </svg>
      <span className="streak-ring-content">
        <IconFlame className="streak-ring-icon" />
        <span className="streak-ring-value">{streak.current}</span>
      </span>
    </span>
  );
}
