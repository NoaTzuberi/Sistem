import { Input } from '../../../../components/common/Input/Input';
import { SelectableChip } from '../SelectableChip/SelectableChip';
import { MAX_DETAILS_LENGTH, setItemDetails, toggleItem } from '../../data/nutritionForm';
import { NUTRITION_PREFERENCES_COPY as COPY } from '../../data/nutritionPreferencesCopy';
import type { FormPreferenceItem } from '../../types';
import './PreferenceItemsField.css';

interface PreferenceItemsFieldProps<T extends string> {
  label: string;
  /** The chips continue a group labelled above (the label still names "other"). */
  hideLabel?: boolean;
  options: readonly { id: T; label: string }[];
  items: FormPreferenceItem<T>[];
  onChange: (items: FormPreferenceItem<T>[]) => void;
}

/**
 * A multi-select chip group. A details field appears only under a chosen item;
 * "Other" needs its text.
 */
export function PreferenceItemsField<T extends string>({ label, hideLabel = false, options, items, onChange }: PreferenceItemsFieldProps<T>) {
  const chosen = options.filter((option) => items.some((item) => item.id === option.id));

  return (
    <div className="preference-items-field">
      {!hideLabel && <span className="text-label">{label}</span>}
      <div className="preference-items-chips" role="group" aria-label={label}>
        {options.map((option) => (
          <SelectableChip
            key={option.id}
            label={option.label}
            selected={items.some((item) => item.id === option.id)}
            onClick={() => onChange(toggleItem(items, option.id))}
          />
        ))}
      </div>
      {chosen.map((option) => {
        const item = items.find((candidate) => candidate.id === option.id)!;
        const isOther = option.id === 'other';
        return (
          <Input
            key={option.id}
            className="preference-items-details"
            label={isOther ? COPY.otherLabel(label) : COPY.detailsLabel(option.label)}
            placeholder={isOther ? COPY.otherPlaceholder : COPY.detailsPlaceholder}
            maxLength={MAX_DETAILS_LENGTH}
            enterKeyHint="done"
            dir="auto"
            value={item.details}
            error={isOther && item.details.trim() === '' ? COPY.otherRequired : undefined}
            onChange={(event) => onChange(setItemDetails(items, option.id, event.target.value))}
          />
        );
      })}
    </div>
  );
}
