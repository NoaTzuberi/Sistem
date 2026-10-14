import { useCopy } from '@sistem/shared';
import { nutritionCopy } from '../../copy';
import type { DraftOption } from '../../nutritionDraft';
import './MealOptionTabs.css';

interface MealOptionTabsProps {
  options: DraftOption[];
  selected: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
}

/** A meal's options as small pills (her names for them), and "+ option". */
export function MealOptionTabs({ options, selected, onSelect, onAdd }: MealOptionTabsProps) {
  const copy = useCopy(nutritionCopy);
  return (
    <div className="nb-option-tabs" role="group" aria-label={copy.optionsTitle}>
      {options.map((option, index) => (
        <button key={option.key} className="nb-option-tab" type="button" aria-pressed={index === selected} onClick={() => onSelect(index)}>
          <bdi>{option.label || '—'}</bdi>
        </button>
      ))}
      <button className="nb-option-tab nb-option-add" type="button" onClick={onAdd}>
        {copy.addOption}
      </button>
    </div>
  );
}
