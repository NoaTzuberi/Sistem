import type { WorkoutStatus } from '@sistem/types';
import './WeekSquares.css';

interface WeekSquaresProps {
  /** This week's workouts in the plan's order; the server decided each status. */
  workouts: readonly { id: string; status: WorkoutStatus }[];
  /** What the row of squares says, e.g. "2 of 4". */
  label: string;
}

/** A trainee's week at a glance: one small square per planned workout (done / missed / still open). */
export function WeekSquares({ workouts, label }: WeekSquaresProps) {
  return (
    <span className="week-squares" role="img" aria-label={label}>
      {workouts.map((workout) => (
        <span key={workout.id} className={`week-square week-square-${workout.status}`} />
      ))}
    </span>
  );
}
