import type { ReactNode } from 'react';
import type { CoachPlan } from '@sistem/types';
import { IconChevronDown } from '@tabler/icons-react';
import { Badge } from '../../../../components/common/Badge/Badge';
import { DAY_NAMES } from '@sistem/shared';
import { PlanExerciseList } from '../../../workouts/components/PlanExerciseList/PlanExerciseList';
import './PlanCard.css';

interface PlanCardProps {
  plan: CoachPlan;
  /** The light actions for this plan (publish), under the workouts. */
  children?: ReactNode;
}

/** One weekly plan, read-only: plans are edited on the web dashboard (PRD §6). */
export function PlanCard({ plan, children }: PlanCardProps) {
  return (
    <div className="plan-card">
      <div className="plan-card-badges">
        <Badge variant={plan.status === 'published' ? 'accent' : 'neutral'}>
          {plan.status === 'published' ? 'Published' : 'Draft'}
        </Badge>
        {plan.locked && <Badge variant="neutral">Started by trainee</Badge>}
      </div>

      {plan.notes && <p className="plan-card-notes">{plan.notes}</p>}
      {plan.workouts.length === 0 && <p className="plan-card-empty">No workouts in this plan yet.</p>}

      {plan.workouts.map((workout) => (
        <details key={workout.id} className="plan-workout">
          <summary className="plan-workout-summary">
            <span className="plan-workout-heading">
              <span className="plan-workout-title">{workout.title}</span>
              <span className="plan-workout-meta">
                {workout.dayOfWeek !== undefined && `${DAY_NAMES[workout.dayOfWeek]} · `}
                {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
              </span>
            </span>
            <IconChevronDown className="plan-workout-chevron" size={20} aria-hidden="true" />
          </summary>

          {workout.notes && <p className="plan-card-notes">{workout.notes}</p>}
          <PlanExerciseList exercises={workout.exercises} />
        </details>
      ))}

      {children}
    </div>
  );
}
