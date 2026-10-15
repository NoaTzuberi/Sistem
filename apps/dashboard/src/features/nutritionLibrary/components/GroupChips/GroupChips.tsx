import type { FoodGroup } from '@sistem/types';
import { FOOD_GROUPS, sharedCopy, useCopy } from '@sistem/shared';
import { nutritionLibraryCopy } from '../../copy';
import './GroupChips.css';

interface GroupChipsProps {
  value: FoodGroup | null;
  counts: { all: number; byGroup: Record<FoodGroup, number> };
  onChange: (group: FoodGroup | null) => void;
}

/** "All groups" (dark when chosen) + one chip per group with its color dot and count (tinted with a ring when chosen). */
export function GroupChips({ value, counts, onChange }: GroupChipsProps) {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionLibraryCopy);
  return (
    <div className="group-chips" role="group" aria-label={copy.groupsLabel}>
      <button className="group-chip group-chip-all" type="button" aria-pressed={value === null} onClick={() => onChange(null)}>
        {copy.allGroups}
        <span className="group-chip-count">{counts.all}</span>
      </button>
      {FOOD_GROUPS.map((group) => (
        <button
          key={group}
          className={`group-chip food-group-${group}`}
          type="button"
          aria-pressed={value === group}
          onClick={() => onChange(group)}
        >
          <span className="group-chip-dot" aria-hidden="true" />
          {shared.nutrition.groups[group]}
          <span className="group-chip-count">{counts.byGroup[group]}</span>
        </button>
      ))}
    </div>
  );
}
