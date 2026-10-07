import { useCallback } from 'react';
import type { AchievementProgress } from '@sistem/types';
import {
  describeAchievement,
  describeAchievementProgress,
  formatUnlockedDate,
  formatVolume,
  streakWeekLabel,
  streakWeeksLabel,
  useLoad,
} from '@sistem/shared';
import { getTraineeAchievements } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import './TraineeAchievements.css';

interface TraineeAchievementsProps {
  traineeId: string;
}

function status(entry: AchievementProgress): string {
  if (entry.count > 0 && entry.unlockedAt) {
    const times = entry.repeatable && entry.count > 1 ? ` · ×${entry.count}` : '';
    return `Unlocked ${formatUnlockedDate(entry.unlockedAt)}${times}`;
  }
  return describeAchievementProgress(entry) ?? 'Not yet';
}

/**
 * The Achievements tab (Phase 11, PRD §6): her weekly streak, lifetime numbers and
 * every achievement with its date or progress. Read-only — computed by the server.
 */
export function TraineeAchievements({ traineeId }: TraineeAchievementsProps) {
  const load = useCallback(() => getTraineeAchievements(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, "Couldn't load the achievements.");

  if (isLoading && !data) return <p className="trainee-achievements-message">Loading…</p>;
  if (!data) {
    return (
      <p className="trainee-achievements-message" role="alert">
        {error} <Button size="sm" onClick={reload}>Try again</Button>
      </p>
    );
  }

  const unlocked = data.progress
    .filter((entry) => entry.count > 0)
    .sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''));
  const locked = data.progress.filter((entry) => entry.count === 0);
  const facts = [
    { label: 'Streak', value: streakWeeksLabel(data.streak.current) },
    { label: 'Best streak', value: streakWeeksLabel(data.streak.best) },
    { label: 'This week', value: streakWeekLabel(data.streak) ?? 'No plan this week' },
    { label: 'Workouts', value: String(data.stats.completedWorkouts) },
    { label: 'Total volume', value: formatVolume(data.stats.totalVolume) },
    { label: 'PRs', value: String(data.stats.personalRecords) },
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
        A week counts toward the streak when {Math.round(data.streak.weekCompletionRatio * 100)}% of its planned workouts are
        done. Weeks without a plan are skipped.
      </p>

      <table className="trainee-achievements-table">
        <caption>
          Achievements · {unlocked.length} of {data.progress.length} unlocked
        </caption>
        <thead>
          <tr>
            <th scope="col">Achievement</th>
            <th scope="col">Rule</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {[...unlocked, ...locked].map((entry) => {
            const text = describeAchievement(entry.type);
            return (
              <tr key={entry.type} className={entry.count > 0 ? 'trainee-achievements-unlocked' : undefined}>
                <th scope="row">{text.name}</th>
                <td>{text.description}</td>
                <td>{status(entry)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
