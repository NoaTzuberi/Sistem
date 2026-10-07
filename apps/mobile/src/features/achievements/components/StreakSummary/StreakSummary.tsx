import type { StreakSummary as Streak } from '@sistem/types';
import { streakWeekLabel } from '@sistem/shared';
import { StreakRing } from '../StreakRing/StreakRing';
import { ACHIEVEMENT_COPY } from '../../data/achievementCopy';
import './StreakSummary.css';

interface StreakSummaryProps {
  streak: Streak;
}

/** The streak with its details: best ever and this week's workouts. Trainee and coach views. */
export function StreakSummary({ streak }: StreakSummaryProps) {
  return (
    <div className="streak-summary">
      <StreakRing streak={streak} size="large" />
      <div className="streak-summary-text">
        <span className="streak-summary-label">{ACHIEVEMENT_COPY.streak}</span>
        <span className="streak-summary-value">{ACHIEVEMENT_COPY.streakValue(streak.current)}</span>
        <span className="streak-summary-detail">{ACHIEVEMENT_COPY.bestStreak(ACHIEVEMENT_COPY.streakValue(streak.best))}</span>
        <span className="streak-summary-detail">{streakWeekLabel(streak) ?? ACHIEVEMENT_COPY.noPlanThisWeek}</span>
      </div>
    </div>
  );
}
