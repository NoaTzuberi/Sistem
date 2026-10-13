import { sharedCopy, useCopy } from '@sistem/shared';
import { TRAINEE_TABS } from '../../../../app/config/routes';
import type { TraineeTab } from '../../../../app/config/routes';
import { useTabListKeys } from '../../../planBuilder/hooks/useTabListKeys';
import { traineesCopy } from '../../copy';
import { traineeTabId, traineeTabLabel } from '../../data/traineeTabs';
import './TraineeTabs.css';

interface TraineeTabsProps {
  selected: TraineeTab;
  /** A count next to a tab's name, where one is known (0 and unknown show none). */
  counts: Partial<Record<TraineeTab, number>>;
  /** The id of the panel the tabs control. */
  panelId: string;
  onSelect: (tab: TraineeTab) => void;
}

/** Her sections as a pill segmented control. Switching is instant; ← → Home End move between them. */
export function TraineeTabs({ selected, counts, panelId, onSelect }: TraineeTabsProps) {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const handleKeyDown = useTabListKeys();

  return (
    <div className="trainee-tabs" role="tablist" aria-label={shared.coach.sectionsLabel} onKeyDown={handleKeyDown}>
      {TRAINEE_TABS.map((id) => {
        const count = counts[id];
        return (
          <button
            key={id}
            className="trainee-tab"
            type="button"
            role="tab"
            data-selects=""
            id={traineeTabId(id)}
            aria-selected={selected === id}
            aria-controls={panelId}
            tabIndex={selected === id ? 0 : -1}
            onClick={() => onSelect(id)}
          >
            {traineeTabLabel(id, copy, shared)}
            {count !== undefined && count > 0 && <span className="trainee-tab-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
