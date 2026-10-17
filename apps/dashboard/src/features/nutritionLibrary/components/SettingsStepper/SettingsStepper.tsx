import { useCopy } from '@sistem/shared';
import { stepValue } from '../../data/settingsForm';
import { nutritionLibraryCopy } from '../../copy';
import './SettingsStepper.css';

interface SettingsStepperProps {
  /** The accessible name of the number. */
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  step: number;
  bounds: { min: number; max: number };
  /** md = in a tile, sm = in a goal row, lg = the floor. */
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  describedBy?: string;
}

/** − / a number / +. The buttons step and stay inside the bounds; the number takes anything (marked when out of range). */
export function SettingsStepper({ label, value, onChange, step, bounds, size = 'md', invalid = false, describedBy }: SettingsStepperProps) {
  const copy = useCopy(nutritionLibraryCopy);
  return (
    <span className={`settings-stepper settings-stepper-${size}${invalid ? ' settings-stepper-invalid' : ''}`}>
      <button
        className="settings-stepper-button"
        type="button"
        aria-label={`${copy.less} · ${label}`}
        disabled={value !== undefined && value <= bounds.min}
        onClick={() => onChange(stepValue(value, -step, bounds))}
      >
        −
      </button>
      <input
        className="settings-stepper-input"
        type="number"
        inputMode="decimal"
        dir="ltr"
        step={step}
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        value={value ?? ''}
        onChange={(event) => {
          const next = event.target.value === '' ? undefined : Number(event.target.value);
          onChange(next !== undefined && Number.isFinite(next) ? next : undefined);
        }}
      />
      <button
        className="settings-stepper-button"
        type="button"
        aria-label={`${copy.more} · ${label}`}
        disabled={value !== undefined && value >= bounds.max}
        onClick={() => onChange(stepValue(value, step, bounds))}
      >
        +
      </button>
    </span>
  );
}
