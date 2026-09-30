import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './FilterChip.css';

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  selected: boolean;
  icon?: ReactNode;
}

export function FilterChip({ label, selected, icon, className, ...rest }: FilterChipProps) {
  const classNames = ['filter-chip', selected ? 'filter-chip-selected' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classNames} aria-pressed={selected} {...rest}>
      {icon && (
        <span className="filter-chip-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="filter-chip-label">{label}</span>
    </button>
  );
}
