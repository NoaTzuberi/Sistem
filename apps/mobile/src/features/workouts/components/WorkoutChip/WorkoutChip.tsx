import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './WorkoutChip.css';

interface WorkoutChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  selected: boolean;
  icon?: ReactNode;
}

export function WorkoutChip({ label, selected, icon, className, ...rest }: WorkoutChipProps) {
  const classNames = ['workout-chip', selected ? 'workout-chip-selected' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classNames} aria-pressed={selected} {...rest}>
      {icon && <span className="workout-chip-icon">{icon}</span>}
      <span className="workout-chip-label">{label}</span>
    </button>
  );
}
