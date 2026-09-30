import { useEffect, useState } from 'react';
import { ProgressRing } from '../ProgressRing/ProgressRing';
import { FlameIcon } from '../icons';
import './StreakRing.css';

export const STREAK_RING_TARGET = 7;

interface StreakRingProps {
  streak: number;
  target?: number;
  compact?: boolean;
}

export function StreakRing({ streak, target = STREAK_RING_TARGET, compact = false }: StreakRingProps) {
  const [progress, setProgress] = useState(0);

  // Sweep in from empty to the real value — also animates smoothly on any
  // later change since it always eases from wherever it currently sits.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setProgress(streak / target));
    return () => cancelAnimationFrame(raf);
  }, [streak, target]);

  return (
    <ProgressRing progress={progress} size={compact ? 64 : 112} strokeWidth={compact ? 5 : 7}>
      <span className={'streak-ring-icon' + (compact ? ' streak-ring-icon-compact' : '')}>
        <FlameIcon />
      </span>
      <span className={'streak-ring-value' + (compact ? ' streak-ring-value-compact' : '')}>{streak}</span>
    </ProgressRing>
  );
}
