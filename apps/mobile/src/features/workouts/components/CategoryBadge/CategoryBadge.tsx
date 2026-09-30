import type { ReactNode } from 'react';
import { workoutCategoryLabel } from '../../data/workoutOptions';
import type { WorkoutCategory } from '../../types';
import './CategoryBadge.css';

interface CategoryBadgeProps {
  category: WorkoutCategory;
  icon?: ReactNode;
  className?: string;
}

export function CategoryBadge({ category, icon, className }: CategoryBadgeProps) {
  const classNames = ['category-badge', `category-badge-${category}`, className].filter(Boolean).join(' ');

  return (
    <span className={classNames}>
      {icon && (
        <span className="category-badge-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {workoutCategoryLabel(category)}
    </span>
  );
}
