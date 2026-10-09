import { fill, useCopy } from '@sistem/shared';
import { workoutCopy } from '../../copy';
import './RatingPicker.css';

const VALUES = [1, 2, 3, 4, 5] as const;

interface RatingPickerProps {
  value: number | null;
  label: string;
  onChange: (value: number | null) => void;
}

/** "How was it?" 1–5 — placeholder until the owner designs the scale. Tapping the chosen one clears it. */
export function RatingPicker({ value, label, onChange }: RatingPickerProps) {
  const copy = useCopy(workoutCopy);
  return (
    <div className="rating-picker" role="radiogroup" aria-label={label}>
      {VALUES.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          aria-label={fill(copy.summary.ratingOption, { value: option })}
          className={'rating-picker-option' + (value === option ? ' rating-picker-option-selected' : '')}
          onClick={() => onChange(value === option ? null : option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
