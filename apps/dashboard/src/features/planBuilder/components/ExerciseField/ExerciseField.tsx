import { useId } from 'react';
import type { Ref } from 'react';
import './ExerciseField.css';

interface ExerciseFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  step?: number;
  /** A second number in the same box — the top of a reps range ("8 – 12"). */
  range?: { label: string; value: number | undefined; onChange: (value: number | undefined) => void };
  inputRef?: Ref<HTMLInputElement>;
}

function toNumber(text: string): number | undefined {
  const next = text === '' ? undefined : Number(text);
  return next !== undefined && Number.isFinite(next) ? next : undefined;
}

/** One labeled number of an open exercise row. Empty means "not set", never 0. */
export function ExerciseField({ label, value, onChange, min = 0, step = 1, range, inputRef }: ExerciseFieldProps) {
  const id = useId();
  return (
    <div className="exercise-field">
      <label className="exercise-field-label" htmlFor={id}>
        {label}
      </label>
      {/* Numbers read left to right in both languages: "8 – 12" keeps its order in Hebrew too. */}
      <div className="exercise-field-box" dir="ltr">
        <input
          ref={inputRef}
          id={id}
          className="exercise-field-input"
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          placeholder="—"
          value={value ?? ''}
          onChange={(event) => onChange(toNumber(event.target.value))}
        />
        {range && (
          <>
            <span className="exercise-field-dash" aria-hidden="true">
              –
            </span>
            <input
              className="exercise-field-input"
              type="number"
              inputMode="decimal"
              min={min}
              step={step}
              placeholder="—"
              aria-label={range.label}
              value={range.value ?? ''}
              onChange={(event) => range.onChange(toNumber(event.target.value))}
            />
          </>
        )}
      </div>
    </div>
  );
}
