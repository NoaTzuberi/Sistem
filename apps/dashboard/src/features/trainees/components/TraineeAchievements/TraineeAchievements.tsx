import { useCallback } from 'react';
import type { AchievementProgress, Language } from '@sistem/types';
import { describeAchievement, describeAchievementProgress, fill, formatUnlockedDate, formatVolume, sharedCopy, streakWeekLabel, streakWeeksLabel, useCopy, useLanguage, useLoad } from '@sistem/shared';
import { getTraineeAchievements } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import './TraineeAchievements.css';
import { traineesCopy } from '../../copy';

interface TraineeAchievementsProps {
  traineeId: string;
}

function status(entry: AchievementProgress, copy: (typeof traineesCopy)['he'], language: Language): string {
  if (entry.count > 0 && entry.unlockedAt) {
    const times = entry.repeatable && entry.count > 1 ? ` · ×${entry.count}` : '';
    return fill(copy.unlockedOn, { date: formatUnlockedDate(entry.unlockedAt, language) }) + times;
  }
  return describeAchievementProgress(entry, language) ?? copy.notYet;
}

/**
 * The Achievements tab (Phase 11, PRD §6): her weekly streak, lifetime numbers and
 * every achievement with its date or progress. Read-only — computed by the server.
 */
export function TraineeAchievements({ traineeId }: TraineeAchievementsProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const load = useCallback(() => getTraineeAchievements(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, copy.achievementsLoadError);

  if (isLoading && !data) return <p className="trainee-achievements-message">{shared.common.loading}</p>;
  if (!data) {
    return (
      <p className="trainee-achievements-message" role="alert">
        {error} <Button size="sm" onClick={reload}>{shared.common.retry}</Button>
      </p>
    );
  }

  const unlocked = data.progress
    .filter((entry) => entry.count > 0)
    .sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''));
  const locked = data.progress.filter((entry) => entry.count === 0);
  const facts = [
    { label: copy.streak, value: streakWeeksLabel(data.streak.current, language) },
    { label: copy.bestStreak, value: streakWeeksLabel(data.streak.best, language) },
    { label: copy.thisWeek, value: streakWeekLabel(data.streak, language) ?? copy.noPlanThisWeek },
    { label: copy.workouts, value: String(data.stats.completedWorkouts) },
    { label: shared.coach.totalVolume, value: formatVolume(data.stats.totalVolume, language) },
    { label: copy.prs, value: String(data.stats.personalRecords) },
  ];

  return (
    <div className="trainee-achievements">
      <dl className="trainee-achievements-facts">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      <p className="trainee-achievements-note">
        {fill(copy.streakRule, { percent: Math.round(data.streak.weekCompletionRatio * 100) })}
      </p>

      <table className="trainee-achievements-table">
        <caption>
          {fill(copy.achievementsCaption, { unlocked: unlocked.length, total: data.progress.length })}
        </caption>
        <thead>
          <tr>
            <th scope="col">{copy.achievement}</th>
            <th scope="col">{copy.rule}</th>
            <th scope="col">{copy.status}</th>
          </tr>
        </thead>
        <tbody>
          {[...unlocked, ...locked].map((entry) => {
            const text = describeAchievement(entry.type, language);
            return (
              <tr key={entry.type} className={entry.count > 0 ? 'trainee-achievements-unlocked' : undefined}>
                <th scope="row">{text.name}</th>
                <td>{text.description}</td>
                <td>{status(entry, copy, language)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
