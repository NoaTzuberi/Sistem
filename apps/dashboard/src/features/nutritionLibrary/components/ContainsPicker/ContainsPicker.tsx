import type { DietTag } from '@sistem/types';
import { sharedCopy, useCopy } from '@sistem/shared';
import './ContainsPicker.css';

const DIET_TAGS = Object.keys(sharedCopy.en.nutrition.dietTags) as DietTag[];

interface ContainsPickerProps {
  value: DietTag[];
  onToggle: (tag: DietTag) => void;
  /** The id of the label above the chips. */
  labelledBy: string;
}

/** What an item contains, as toggle chips (charcoal when on). */
export function ContainsPicker({ value, onToggle, labelledBy }: ContainsPickerProps) {
  const shared = useCopy(sharedCopy);
  return (
    <div className="contains-picker" role="group" aria-labelledby={labelledBy}>
      {DIET_TAGS.map((tag) => (
        <button key={tag} className="contains-chip" type="button" aria-pressed={value.includes(tag)} onClick={() => onToggle(tag)}>
          {shared.nutrition.dietTags[tag]}
        </button>
      ))}
    </div>
  );
}
