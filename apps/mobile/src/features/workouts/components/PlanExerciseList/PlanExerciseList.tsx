import type { PlanExercise } from '@sistem/types';
import { describeTargets } from '@sistem/shared';
import './PlanExerciseList.css';

interface PlanExerciseListProps {
  exercises: PlanExercise[];
}

/** The exercises of one planned workout, read-only — used by the trainee and by coach mode. */
export function PlanExerciseList({ exercises }: PlanExerciseListProps) {
  return (
    <ul className="plan-exercises">
      {exercises.map((exercise) => (
        <li key={exercise.id} className={exercise.supersetGroup ? 'plan-exercise plan-exercise-superset' : 'plan-exercise'}>
          <span className="plan-exercise-name">
            {exercise.exercise?.name ?? 'Exercise'}
            {exercise.supersetGroup && (
              <span className="plan-exercise-superset-label"> · Superset {exercise.supersetGroup}</span>
            )}
          </span>
          {describeTargets(exercise.resolvedSets).map((line) => (
            <span key={line} className="plan-exercise-target">
              {line}
            </span>
          ))}
          {/* The coach's notes are the instructions the trainee sees (PRD §5.2). */}
          {exercise.notes && <span className="plan-exercise-notes">{exercise.notes}</span>}
        </li>
      ))}
    </ul>
  );
}
