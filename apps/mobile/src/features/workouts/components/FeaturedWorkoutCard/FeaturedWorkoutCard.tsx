import { Link, useLocation } from 'react-router-dom';
import { GlassCard } from '../../../../components/common/GlassCard/GlassCard';
import { Button } from '../../../../components/common/Button/Button';
import { CategoryBadge } from '../CategoryBadge/CategoryBadge';
import { workoutTemplatePath } from '../../../../app/config/routes';
import { getCategoryVisual } from '../../data/categoryVisuals';
import type { WorkoutTemplate } from '../../types';
import './FeaturedWorkoutCard.css';

interface FeaturedWorkoutCardProps {
  template: WorkoutTemplate;
  /** e.g. "Matches your strength goal" or "Recently added" — no reason renders a plain label only. */
  reason?: string;
  isPersonalized: boolean;
}

export function FeaturedWorkoutCard({ template, reason, isPersonalized }: FeaturedWorkoutCardProps) {
  const location = useLocation();
  const { coverImage, Icon } = getCategoryVisual(template.category);

  return (
    <GlassCard className="featured-workout-card" variant="flat">
      <div className="featured-workout-cover">
        <div className="featured-workout-cover-image" style={{ backgroundImage: `url(${coverImage})` }} />
        {template.category && (
          <CategoryBadge category={template.category} icon={<Icon />} className="featured-workout-cover-badge" />
        )}
      </div>
      <div className="featured-workout-body">
        <span className="featured-workout-label">{isPersonalized ? 'Recommended for you' : 'Recently added'}</span>
        {reason && <p className="featured-workout-reason">{reason}</p>}
        <h2 className="featured-workout-name">{template.name}</h2>
        <span className="featured-workout-underline" />
        {template.description && <p className="featured-workout-description text-body">{template.description}</p>}
        <div className="featured-workout-meta">
          <span>{template.exercises.length} exercises</span>
          {template.duration && <span>{template.duration} min</span>}
          {template.difficulty && (
            <span className="featured-workout-difficulty-tag">{template.difficulty}</span>
          )}
        </div>
        <Link
          to={workoutTemplatePath(template.id)}
          state={{ backgroundLocation: location }}
          className="featured-workout-cta"
        >
          <Button>View workout</Button>
        </Link>
      </div>
    </GlassCard>
  );
}