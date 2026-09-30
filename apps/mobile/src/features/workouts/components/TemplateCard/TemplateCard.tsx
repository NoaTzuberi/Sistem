import { Link, useLocation } from 'react-router-dom';
import { GlassCard } from '../../../../components/common/GlassCard/GlassCard';
import { CategoryBadge } from '../CategoryBadge/CategoryBadge';
import { workoutTemplatePath } from '../../../../app/config/routes';
import { getCategoryVisual } from '../../data/categoryVisuals';
import type { WorkoutTemplate } from '../../types';
import './TemplateCard.css';

const NEW_THRESHOLD_MS = 24 * 60 * 60 * 1000;

interface TemplateCardProps {
  template: WorkoutTemplate;
  /** Number of times this user has completed this template. Omit/0 renders no indicator — never fabricated. */
  completionCount?: number;
}

export function TemplateCard({ template, completionCount }: TemplateCardProps) {
  const location = useLocation();
  const isNew = template.isOwner && Date.now() - new Date(template.createdAt).getTime() < NEW_THRESHOLD_MS;
  const { coverImage, Icon } = getCategoryVisual(template.category);

  return (
    <Link
      to={workoutTemplatePath(template.id)}
      state={{ backgroundLocation: location }}
      className="template-card-link"
    >
      <GlassCard className="template-card" variant="flat">
        <div className="template-card-cover" style={{ backgroundImage: `url(${coverImage})` }}>
          {template.category && (
            <CategoryBadge
              category={template.category}
              icon={<Icon />}
              className="template-card-cover-badge"
            />
          )}
        </div>
        <div className="template-card-body">
          <div className="template-card-name-row">
            <h3 className="template-card-name">{template.name}</h3>
            {isNew && <span className="template-card-new-dot" title="New" />}
          </div>
          <span className="template-card-underline" />
          {template.description && <p className="template-card-description text-body">{template.description}</p>}
          <div className="template-card-meta">
            <span>{template.exercises.length} exercises</span>
            {template.duration && <span>{template.duration} min</span>}
            {template.difficulty && (
              <span className="template-card-difficulty-tag">{template.difficulty}</span>
            )}
            {completionCount ? <span className="template-card-completion">Done {completionCount}x</span> : null}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}