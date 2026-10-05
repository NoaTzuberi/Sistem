import { Link } from 'react-router-dom';
import type { TraineePlanWorkout } from '@sistem/types';
import { DAY_NAMES } from '@sistem/shared';
import { IconChevronRight } from '@tabler/icons-react';
import { Badge } from '../../../../components/common/Badge/Badge';
import { WORKOUTS_COPY, exerciseCountLabel, workoutStatusBadge } from '../../data/workoutCopy';
import './WorkoutRow.css';

const SHORT_DAY_LENGTH = 3;

interface WorkoutRowProps {
  workout: TraineePlanWorkout;
  /** Where a tap goes; without it the row is plain text (a missed workout of a past week). */
  to?: string;
}

/** One planned workout: its day, title and status. */
export function WorkoutRow({ workout, to }: WorkoutRowProps) {
  const badge = workoutStatusBadge(workout);
  const day =
    workout.dayOfWeek === undefined ? WORKOUTS_COPY.anyDay : DAY_NAMES[workout.dayOfWeek].slice(0, SHORT_DAY_LENGTH);

  const content = (
    <>
      <span className="workout-row-day">{day}</span>
      <span className="workout-row-main">
        <span className="workout-row-title">{workout.title}</span>
        <span className="workout-row-meta">{exerciseCountLabel(workout.exercises.length)}</span>
      </span>
      <Badge variant={badge.variant} className="workout-row-status">
        {badge.label}
      </Badge>
      {to && <IconChevronRight className="workout-row-chevron" size={20} aria-hidden="true" />}
    </>
  );

  return to ? (
    <Link className="workout-row workout-row-link" to={to}>
      {content}
    </Link>
  ) : (
    <div className="workout-row">{content}</div>
  );
}
