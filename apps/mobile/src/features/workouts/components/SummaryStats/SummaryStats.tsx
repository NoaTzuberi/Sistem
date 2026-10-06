import type { WorkoutLogStats } from '@sistem/types';
import { formatDuration } from '@sistem/shared';
import { SUMMARY_COPY } from '../../data/workoutCopy';
import './SummaryStats.css';

interface SummaryStatsProps {
  stats: WorkoutLogStats;
}

/** The four numbers the server computed at finish (PRD §5.3), as 2×2 tiles. */
export function SummaryStats({ stats }: SummaryStatsProps) {
  const tiles = [
    { label: SUMMARY_COPY.statDuration, value: formatDuration(stats.durationSec) },
    { label: SUMMARY_COPY.statVolume, value: `${stats.totalVolume.toLocaleString()} kg` },
    { label: SUMMARY_COPY.statSets, value: String(stats.setsCompleted) },
    { label: SUMMARY_COPY.statPrs, value: String(stats.prCount) },
  ];
  return (
    <dl className="summary-stats">
      {tiles.map((tile) => (
        <div key={tile.label} className="summary-stats-tile">
          <dt className="summary-stats-label">{tile.label}</dt>
          <dd className="summary-stats-value">{tile.value}</dd>
        </div>
      ))}
    </dl>
  );
}
