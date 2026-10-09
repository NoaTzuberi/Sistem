import './UnitToggle.css';

interface UnitToggleProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  /** What each option shows ('ק״ג' for 'kg'); the option itself by default. */
  optionLabel?: (option: T) => string;
  disabled?: boolean;
  onChange: (value: T) => void;
}

/** Two-way unit switch (kg | lb, cm | in). */
export function UnitToggle<T extends string>({ label, options, value, optionLabel, disabled, onChange }: UnitToggleProps<T>) {
  return (
    <div className="unit-toggle">
      <span className="unit-toggle-label">{label}</span>
      <div className="unit-toggle-options" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={'unit-toggle-option' + (option === value ? ' unit-toggle-option-active' : '')}
            aria-pressed={option === value}
            disabled={disabled}
            onClick={() => option !== value && onChange(option)}
          >
            {optionLabel ? optionLabel(option) : option}
          </button>
        ))}
      </div>
    </div>
  );
}
