import './FilterSegment.css';

interface FilterSegmentProps<T extends string> {
  /** What the control chooses, for screen readers. */
  label: string;
  /** Exactly two choices: the thumb slides between two halves. */
  options: readonly [{ id: T; label: string }, { id: T; label: string }];
  value: T;
  onChange: (value: T) => void;
}

/** An iOS-style segmented control of two: a grey track and a white thumb that slides (transform only). */
export function FilterSegment<T extends string>({ label, options, value, onChange }: FilterSegmentProps<T>) {
  const isSecond = value === options[1].id;
  return (
    <div className={isSecond ? 'filter-segment filter-segment-second' : 'filter-segment'} role="group" aria-label={label}>
      <span className="filter-segment-thumb" aria-hidden="true" />
      {options.map((option) => (
        <button key={option.id} className="filter-segment-option" type="button" aria-pressed={option.id === value} onClick={() => onChange(option.id)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
