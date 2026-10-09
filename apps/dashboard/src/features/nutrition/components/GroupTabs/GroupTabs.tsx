import type { FoodGroup } from '@sistem/types';
import { sharedCopy, useCopy } from '@sistem/shared';
import './GroupTabs.css';

interface GroupTabsProps<T extends FoodGroup | null> {
  groups: readonly T[];
  value: T;
  onChange: (group: T) => void;
  label: string;
  /** Text for the null entry (e.g. "All groups"). */
  allLabel?: string;
}

/** One row of group buttons (single-select) — the picker's tabs and the food list's group filter. */
export function GroupTabs<T extends FoodGroup | null>({ groups, value, onChange, label, allLabel }: GroupTabsProps<T>) {
  const shared = useCopy(sharedCopy);
  return (
    <div className="group-tabs" role="group" aria-label={label}>
      {groups.map((group) => (
        <button
          key={group ?? 'all'}
          type="button"
          className={'group-tab' + (value === group ? ' group-tab-selected' : '')}
          aria-pressed={value === group}
          onClick={() => onChange(group)}
        >
          {group === null ? allLabel : shared.nutrition.groups[group]}
        </button>
      ))}
    </div>
  );
}
