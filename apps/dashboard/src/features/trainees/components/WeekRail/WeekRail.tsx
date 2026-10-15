import { useEffect, useRef } from 'react';
import { useCopy } from '@sistem/shared';
import { useTabListKeys } from '../../../planBuilder/hooks/useTabListKeys';
import { traineesCopy } from '../../copy';
import type { ProgramWeek } from '../../hooks/useTraineeWeeks';
import { WeekRailItem } from '../WeekRailItem/WeekRailItem';
import './WeekRail.css';

interface WeekRailProps {
  weeks: ProgramWeek[];
  selected: string;
  onSelect: (weekStartDate: string) => void;
  /** The id of the week panel the tabs control. */
  panelId: string;
}

/** Her program's weeks in one scrollable row (a tab list: ← → Home End move between weeks). */
export function WeekRail({ weeks, selected, onSelect, panelId }: WeekRailProps) {
  const copy = useCopy(traineesCopy);
  const handleKeyDown = useTabListKeys();
  const railRef = useRef<HTMLDivElement>(null);

  // The selected week stays in view (on load, and when the chart selects one).
  useEffect(() => {
    railRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [selected]);

  return (
    <div ref={railRef} className="pw-rail" role="tablist" aria-label={copy.weeks.railLabel} aria-controls={panelId} onKeyDown={handleKeyDown}>
      {weeks.map((week) => (
        <WeekRailItem key={week.weekStartDate} week={week} isSelected={week.weekStartDate === selected} onSelect={() => onSelect(week.weekStartDate)} />
      ))}
    </div>
  );
}
