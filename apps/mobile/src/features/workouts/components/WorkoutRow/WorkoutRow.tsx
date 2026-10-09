import { Link } from 'react-router-dom';
import type { TraineePlanWorkout } from '@sistem/types';
import { useCopy, useLanguage, weekdayName } from '@sistem/shared';
import { IconChevronRight } from '@tabler/icons-react';
import { Badge } from '../../../../components/common/Badge/Badge';
import { exerciseCountLabel, workoutStatusBadge } from '../../data/workoutDisplay';
import { workoutCopy } from '../../copy';
import './WorkoutRow.css';


interface WorkoutRowProps {
  workout: TraineePlanWorkout;
  /** Where a tap goes; without it the row is plain text (a missed workout of a past week). */
  to?: string;
}

/** One planned workout: its day, title and status. */
export function WorkoutRow({ workout, to }: WorkoutRowProps) {
  const language = useLanguage();
  const copy = useCopy(workoutCopy);
  const badge = workoutStatusBadge(workout, copy);
  const day =
    workout.dayOfWeek === undefined ? copy.list.anyDay : weekdayName(workout.dayOfWeek, language, 'short');

  const content = (
    <>
      <span className="workout-row-day">{day}</span>
      <span className="workout-row-main">
        <span className="workout-row-title" dir="auto">{workout.title}</span>
        <span className="workout-row-meta">{exerciseCountLabel(workout.exercises.length, copy, language)}</span>
      </span>
      <Badge variant={badge.variant} className="workout-row-status">
        {badge.label}
      </Badge>
      {to && <IconChevronRight className="flip-rtl workout-row-chevron" size={20} aria-hidden="true" />}
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
