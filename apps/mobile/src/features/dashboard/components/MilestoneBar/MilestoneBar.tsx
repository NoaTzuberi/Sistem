import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './MilestoneBar.css';

const WORKOUT_MILESTONES = [10, 25, 50, 100, 250, 500];

function getNextMilestone(total: number): number {
  return WORKOUT_MILESTONES.find((milestone) => milestone > total) ?? total + 50;
}

interface MilestoneBarProps {
  totalWorkouts: number;
  segmentCount?: number;
  compact?: boolean;
  showLabel?: boolean;
}

export function MilestoneBar({ totalWorkouts, segmentCount = 10, compact = false, showLabel = true }: MilestoneBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const nextMilestone = getNextMilestone(totalWorkouts);
  const filledSegments = Math.min(segmentCount, Math.round((totalWorkouts / nextMilestone) * segmentCount));

  useEffect(() => {
    const container = barRef.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const segments = gsap.utils.toArray<HTMLElement>('.milestone-segment', container);
    if (segments.length === 0) return;

    const animation = gsap.fromTo(
      segments,
      { scaleY: 0.3, opacity: 0 },
      { scaleY: 1, opacity: 1, duration: 0.35, ease: 'power2.out', stagger: 0.04 },
    );

    return () => {
      animation.kill();
    };
  }, [totalWorkouts]);

  return (
    <div>
      <div
        className={'milestone-segments' + (compact ? ' milestone-segments-compact' : '')}
        ref={barRef}
        role="progressbar"
        aria-valuenow={totalWorkouts}
        aria-valuemin={0}
        aria-valuemax={nextMilestone}
      >
        {Array.from({ length: segmentCount }).map((_, index) => (
          <span
            key={index}
            className={'milestone-segment' + (index < filledSegments ? ' milestone-segment-filled' : '')}
          />
        ))}
      </div>
      {showLabel && (
        <span className="dashboard-milestone-label">
          {totalWorkouts} / {nextMilestone} to next milestone
        </span>
      )}
    </div>
  );
}
