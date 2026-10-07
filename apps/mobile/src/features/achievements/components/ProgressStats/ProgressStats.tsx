import type { AchievementOverview } from '@sistem/types';
import { formatVolume } from '@sistem/shared';
import { ACHIEVEMENT_COPY } from '../../data/achievementCopy';
import './ProgressStats.css';

interface ProgressStatsProps {
  overview: AchievementOverview;
}

/** Her lifetime numbers (Profile, coach view) — all computed by the server. */
export function ProgressStats({ overview }: ProgressStatsProps) {
  const unlocked = overview.progress.filter((entry) => entry.count > 0).length;
  const stats = [
    { label: ACHIEVEMENT_COPY.statWorkouts, value: String(overview.stats.completedWorkouts) },
    { label: ACHIEVEMENT_COPY.statVolume, value: formatVolume(overview.stats.totalVolume) },
    { label: ACHIEVEMENT_COPY.statPrs, value: String(overview.stats.personalRecords) },
    { label: ACHIEVEMENT_COPY.statAchievements, value: `${unlocked} / ${overview.progress.length}` },
  ];
  return (
    <dl className="progress-stats">
      {stats.map((stat) => (
        <div key={stat.label} className="progress-stats-item">
          <dt className="progress-stats-label">{stat.label}</dt>
          <dd className="progress-stats-value">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
