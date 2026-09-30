import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './WeekDotStrip.css';

/** Last 7 calendar days ending today, as single-letter weekday labels. */
function getLast7DayLetters(): string[] {
  const letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const days: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(letters[date.getDay()]);
  }
  return days;
}

interface WeekDotStripProps {
  workoutsLast7Days: number;
  compact?: boolean;
}

export function WeekDotStrip({ workoutsLast7Days, compact = false }: WeekDotStripProps) {
  const dotsRef = useRef<HTMLDivElement>(null);
  const dayLetters = getLast7DayLetters();

  useEffect(() => {
    const container = dotsRef.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dots = gsap.utils.toArray<HTMLElement>('.day-dot', container);
    if (dots.length === 0) return;

    const animation = gsap.fromTo(
      dots,
      { scale: 0.4, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.8)', stagger: 0.05 },
    );

    return () => {
      animation.kill();
    };
  }, [workoutsLast7Days]);

  return (
    <div className={'day-dots' + (compact ? ' day-dots-compact' : '')} ref={dotsRef}>
      {dayLetters.map((letter, index) => {
        const filled = index >= dayLetters.length - workoutsLast7Days;
        return (
          <div className="day-dot-column" key={index}>
            <span className={'day-dot' + (compact ? ' day-dot-compact' : '') + (filled ? ' day-dot-filled' : '')} />
            <span className="day-dot-letter">{letter}</span>
          </div>
        );
      })}
    </div>
  );
}
