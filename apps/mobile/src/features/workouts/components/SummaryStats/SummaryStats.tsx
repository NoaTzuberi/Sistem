import type { WorkoutLogStats } from '@sistem/types';
import { formatDuration, formatVolume, useCopy, useLanguage } from '@sistem/shared';
import { workoutCopy } from '../../copy';
import './SummaryStats.css';

interface SummaryStatsProps {
  stats: WorkoutLogStats;
}

/** The four numbers the server computed at finish (PRD §5.3), as 2×2 tiles. */
export function SummaryStats({ stats }: SummaryStatsProps) {
  const language = useLanguage();
  const copy = useCopy(workoutCopy);
  const tiles = [
    { label: copy.summary.statDuration, value: formatDuration(stats.durationSec, language) },
    { label: copy.summary.statVolume, value: formatVolume(stats.totalVolume, language) },
    { label: copy.summary.statSets, value: String(stats.setsCompleted) },
    { label: copy.summary.statPrs, value: String(stats.prCount) },
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
