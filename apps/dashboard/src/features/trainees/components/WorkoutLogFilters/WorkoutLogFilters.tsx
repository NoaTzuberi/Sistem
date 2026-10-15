import { fill, formatNumber, useCopy, useLanguage } from '@sistem/shared';
import { RangeSegmented } from '../../../stats/components/RangeSegmented/RangeSegmented';
import { traineesCopy } from '../../copy';
import type { LogFilter } from '../../hooks/useWorkoutLogs';

interface WorkoutLogFiltersProps {
  value: LogFilter;
  counts: Record<LogFilter, number>;
  onChange: (filter: LogFilter) => void;
}

/** All · records · with a photo, each with its count (the shared segmented control). */
export function WorkoutLogFilters({ value, counts, onChange }: WorkoutLogFiltersProps) {
  const language = useLanguage();
  const copy = useCopy(traineesCopy);
  const count = (filter: LogFilter) => formatNumber(counts[filter], language);
  const options: { id: LogFilter; label: string }[] = [
    { id: 'all', label: fill(copy.logs.filterAll, { count: count('all') }) },
    { id: 'prs', label: fill(copy.logs.filterPrs, { count: count('prs') }) },
    { id: 'photo', label: fill(copy.logs.filterPhoto, { count: count('photo') }) },
  ];
  return <RangeSegmented label={copy.logs.filterLabel} options={options} value={value} onChange={onChange} />;
}
