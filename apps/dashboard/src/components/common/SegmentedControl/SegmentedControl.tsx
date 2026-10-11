import './SegmentedControl.css';

interface SegmentedControlProps<T extends string | number> {
  /** What the group chooses, for screen readers. */
  label: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A pill of a few exclusive choices; the chosen one is a white floating pill. */
export function SegmentedControl<T extends string | number>({ label, options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="segmented-control" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          className="segmented-option"
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
