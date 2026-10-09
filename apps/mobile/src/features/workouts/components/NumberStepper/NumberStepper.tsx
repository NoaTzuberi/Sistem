import { useCopy } from '@sistem/shared';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { workoutCopy } from '../../copy';
import './NumberStepper.css';

interface NumberStepperProps {
  value: number | undefined;
  step: number;
  max: number;
  /** Decimals allowed (weights); otherwise whole numbers (reps, seconds). */
  decimal?: boolean;
  /** Accessible name, e.g. "Weight for set 2, kg". */
  label: string;
  onChange: (value: number | undefined) => void;
}

/** Up to two decimals, without trailing zeros: 42.5, 43, 12.25. */
function format(value: number | undefined): string {
  return value === undefined ? '' : String(Math.round(value * 100) / 100);
}

function clamp(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value * 100) / 100));
}

/**
 * −  value  + : big buttons for one-handed use at the gym, and the number itself opens
 * the numeric keypad. Empty means "no value" (e.g. no weight on a bodyweight set).
 */
export function NumberStepper({ value, step, max, decimal = false, label, onChange }: NumberStepperProps) {
  const copy = useCopy(workoutCopy);
  const [draft, setDraft] = useState(format(value));

  useEffect(() => {
    setDraft(format(value));
  }, [value]);

  const pattern = decimal ? /^\d*[.,]?\d*$/ : /^\d*$/;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    if (!pattern.test(next)) return;
    setDraft(next);
  }

  function commitDraft() {
    if (draft.trim() === '') {
      if (value !== undefined) onChange(undefined);
      return;
    }
    const parsed = Number(draft.replace(',', '.'));
    if (Number.isNaN(parsed)) {
      setDraft(format(value));
      return;
    }
    const next = clamp(decimal ? parsed : Math.round(parsed), max);
    setDraft(format(next));
    if (next !== value) onChange(next);
  }

  return (
    <div className="number-stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="number-stepper-button"
        aria-label={`${copy.session.decrease} ${label}`}
        disabled={value === undefined || value <= 0}
        onClick={() => onChange(clamp((value ?? 0) - step, max))}
      >
        −
      </button>
      <input
        className="number-stepper-input"
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        enterKeyHint="done"
        placeholder="–"
        value={draft}
        aria-label={label}
        onChange={handleChange}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        onFocus={(event) => event.currentTarget.select()}
      />
      <button
        type="button"
        className="number-stepper-button"
        aria-label={`${copy.session.increase} ${label}`}
        disabled={value !== undefined && value >= max}
        onClick={() => onChange(clamp((value ?? 0) + step, max))}
      >
        +
      </button>
    </div>
  );
}
