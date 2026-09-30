import type { ReactNode } from 'react';
import type { WorkoutGoalAccent } from '../../data/workoutOptions';
import './GoalCard.css';

interface GoalCardProps {
  icon: ReactNode;
  label: string;
  selected: boolean;
  accent: WorkoutGoalAccent;
  onClick: () => void;
}

export function GoalCard({ icon, label, selected, accent, onClick }: GoalCardProps) {
  const classNames = [
    'goal-card',
    `goal-card-${accent}`,
    selected ? 'goal-card-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classNames} onClick={onClick} aria-pressed={selected}>
      <span className="goal-card-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="goal-card-label">{label}</span>
    </button>
  );
}
