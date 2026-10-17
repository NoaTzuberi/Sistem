import './NumberField.css';

interface NumberFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  step?: number;
  disabled?: boolean;
  /** Hide the label visually (table cells with a column header); still read aloud. */
  hideLabel?: boolean;
}

/** A small numeric input. Empty means "not set" (undefined), never 0. */
export function NumberField({ label, value, onChange, min = 0, step = 1, disabled, hideLabel }: NumberFieldProps) {
  return (
    <label className="number-field">
      <span className={hideLabel ? 'number-field-label visually-hidden' : 'number-field-label'}>{label}</span>
      <input
        className="number-field-input"
        type="number"
        inputMode="decimal"
        dir="ltr"
        min={min}
        step={step}
        disabled={disabled}
        value={value ?? ''}
        onChange={(event) => {
          const next = event.target.value === '' ? undefined : Number(event.target.value);
          onChange(next !== undefined && Number.isFinite(next) ? next : undefined);
        }}
      />
    </label>
  );
}
