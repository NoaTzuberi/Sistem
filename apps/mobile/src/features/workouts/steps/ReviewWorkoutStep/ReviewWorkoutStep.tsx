import { workoutCategoryLabel, workoutGoalLabel } from '../../data/workoutOptions';
import { DIFFICULTY_OPTIONS } from '../../../exercises/data/filterOptions';
import type { WorkoutExerciseRowValue } from '../../components/WorkoutExerciseRow/WorkoutExerciseRow';
import type { WorkoutCategory, WorkoutGoal } from '../../types';
import type { Difficulty } from '../../../exercises/types';
import './ReviewWorkoutStep.css';

interface ReviewWorkoutStepProps {
  name: string;
  description: string;
  category: WorkoutCategory | '';
  difficulty: Difficulty | '';
  duration: string;
  goal: WorkoutGoal[];
  rows: WorkoutExerciseRowValue[];
}

export function ReviewWorkoutStep({
  name,
  description,
  category,
  difficulty,
  duration,
  goal,
  rows,
}: ReviewWorkoutStepProps) {
  return (
    <div className="workout-builder-step-fields">
      <div className="review-workout-header">
        <h3 className="review-workout-name">{name || 'Untitled workout'}</h3>
        {description && <p className="review-workout-description">{description}</p>}
      </div>

      <div className="review-workout-badges">
        {category && <span className="review-workout-tag">{workoutCategoryLabel(category)}</span>}
        {difficulty && (
          <span className="review-workout-tag">
            {DIFFICULTY_OPTIONS.find((option) => option.value === difficulty)?.label ?? difficulty}
          </span>
        )}
        {duration && <span className="review-workout-tag">{duration} min</span>}
        {goal.map((value) => (
          <span key={value} className="review-workout-tag review-workout-tag-accent">
            {workoutGoalLabel(value)}
          </span>
        ))}
      </div>

      <div className="review-workout-exercises">
        <span className="workout-builder-field-label">Exercises ({rows.length})</span>
        <ul className="review-workout-exercise-list">
          {rows.map((row) => (
            <li key={row.exercise.id} className="review-workout-exercise-item">
              <span className="review-workout-exercise-name">{row.exercise.name}</span>
              <span className="review-workout-exercise-detail">
                {row.defaultSets} × {row.defaultReps}
                {row.defaultWeight ? ` @ ${row.defaultWeight}kg` : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}