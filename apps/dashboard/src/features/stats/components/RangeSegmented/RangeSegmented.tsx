import type { CSSProperties } from 'react';
import './RangeSegmented.css';

interface RangeSegmentedProps<T extends string | number> {
  /** What the group chooses, for screen readers. */
  label: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** compact = shorter options inside a card (a trainee's Body tab). */
  size?: 'regular' | 'compact';
}

/** The Statistics range: a few exclusive choices on a rail, with a white thumb that slides to the chosen one. */
export function RangeSegmented<T extends string | number>({ label, options, value, onChange, size = 'regular' }: RangeSegmentedProps<T>) {
  const chosen = Math.max(0, options.findIndex((option) => option.id === value));
  return (
    // Computed values, not styling: how many choices the rail holds and which one the thumb is on.
    <div className={size === 'compact' ? 'range-segmented range-segmented-compact' : 'range-segmented'} role="group" aria-label={label} style={{ '--range-count': options.length } as CSSProperties}>
      <span className="range-segmented-thumb" aria-hidden="true" style={{ '--range-index': chosen } as CSSProperties} />
      {options.map((option) => (
        <button
          key={option.id}
          className="range-segmented-option"
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
