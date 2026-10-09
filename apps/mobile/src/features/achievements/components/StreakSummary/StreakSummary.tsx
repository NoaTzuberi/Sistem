import type { StreakSummary as Streak } from '@sistem/types';
import { fill, streakWeekLabel, useCopy, useI18n, useLanguage } from '@sistem/shared';
import { StreakRing } from '../StreakRing/StreakRing';
import { achievementCopy } from '../../copy';
import './StreakSummary.css';

interface StreakSummaryProps {
  streak: Streak;
}

/** The streak with its details: best ever and this week's workouts. Trainee and coach views. */
export function StreakSummary({ streak }: StreakSummaryProps) {
  const language = useLanguage();
  const { plural } = useI18n();
  const copy = useCopy(achievementCopy);
  return (
    <div className="streak-summary">
      <StreakRing streak={streak} size="large" />
      <div className="streak-summary-text">
        <span className="streak-summary-label">{copy.streak}</span>
        <span className="streak-summary-value">{plural(copy.streakValue, streak.current)}</span>
        <span className="streak-summary-detail">{fill(copy.bestStreak, { label: plural(copy.streakValue, streak.best) })}</span>
        <span className="streak-summary-detail">{streakWeekLabel(streak, language) ?? copy.noPlanThisWeek}</span>
      </div>
    </div>
  );
}
