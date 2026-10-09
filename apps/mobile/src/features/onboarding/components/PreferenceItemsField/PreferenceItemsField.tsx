import { fill, useCopy } from '@sistem/shared';
import { Input } from '../../../../components/common/Input/Input';
import { SelectableChip } from '../SelectableChip/SelectableChip';
import { MAX_DETAILS_LENGTH, setItemDetails, toggleItem } from '../../data/nutritionForm';
import { onboardingCopy } from '../../copy';
import type { FormPreferenceItem } from '../../types';
import './PreferenceItemsField.css';

interface PreferenceItemsFieldProps<T extends string> {
  label: string;
  /** The chips continue a group labelled above (the label still names "other"). */
  hideLabel?: boolean;
  options: readonly T[];
  /** The option labels by id (shared copy), in the language on screen. */
  labels: Readonly<Record<T, string>>;
  items: FormPreferenceItem<T>[];
  onChange: (items: FormPreferenceItem<T>[]) => void;
}

/**
 * A multi-select chip group. A details field appears only under a chosen item;
 * "Other" needs its text.
 */
export function PreferenceItemsField<T extends string>({ label, hideLabel = false, options, labels, items, onChange }: PreferenceItemsFieldProps<T>) {
  const copy = useCopy(onboardingCopy);
  const chosen = options.filter((option) => items.some((item) => item.id === option));

  return (
    <div className="preference-items-field">
      {!hideLabel && <span className="text-label">{label}</span>}
      <div className="preference-items-chips" role="group" aria-label={label}>
        {options.map((option) => (
          <SelectableChip
            key={option}
            label={labels[option]}
            selected={items.some((item) => item.id === option)}
            onClick={() => onChange(toggleItem(items, option))}
          />
        ))}
      </div>
      {chosen.map((option) => {
        const item = items.find((candidate) => candidate.id === option)!;
        const isOther = option === 'other';
        return (
          <Input
            key={option}
            className="preference-items-details"
            label={isOther ? fill(copy.nutrition.otherLabel, { group: label }) : fill(copy.nutrition.detailsLabel, { label: labels[option] })}
            placeholder={isOther ? copy.nutrition.otherPlaceholder : copy.nutrition.detailsPlaceholder}
            maxLength={MAX_DETAILS_LENGTH}
            enterKeyHint="done"
            dir="auto"
            value={item.details}
            error={isOther && item.details.trim() === '' ? copy.nutrition.otherRequired : undefined}
            onChange={(event) => onChange(setItemDetails(items, option, event.target.value))}
          />
        );
      })}
    </div>
  );
}
