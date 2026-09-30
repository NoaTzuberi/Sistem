import { GlassCard } from '../../../../components/common/GlassCard/GlassCard';
import { muscleLabel } from '../../../exercises/data/filterOptions';
import { estimateWorkoutMinutes } from '../../data/workoutEstimate';
import { collectCoveredMuscles } from '../../data/bodyRegions';
import { ExerciseCountIcon, DurationIcon } from '../icons';
import type { WorkoutExerciseRowValue } from '../WorkoutExerciseRow/WorkoutExerciseRow';
import './WorkoutSummaryCard.css';

interface WorkoutSummaryCardProps {
  rows: WorkoutExerciseRowValue[];
}

export function WorkoutSummaryCard({ rows }: WorkoutSummaryCardProps) {
  const exerciseCount = rows.length;
  const estimatedMinutes = estimateWorkoutMinutes(rows);
  const coveredMuscles = collectCoveredMuscles(rows);

  return (
    <GlassCard className="workout-summary-card" variant="flat">
      <span className="workout-summary-title">Workout Summary</span>

      <div className="workout-summary-stat">
        <span className="workout-summary-stat-icon" aria-hidden="true">
          <ExerciseCountIcon />
        </span>
        <span className="workout-summary-stat-text">
          <span className="workout-summary-stat-value">{exerciseCount}</span>
          <span className="workout-summary-stat-label">{exerciseCount === 1 ? 'Exercise' : 'Exercises'}</span>
        </span>
      </div>

      <div className="workout-summary-stat">
        <span className="workout-summary-stat-icon" aria-hidden="true">
          <DurationIcon />
        </span>
        <span className="workout-summary-stat-text">
          <span className="workout-summary-stat-value">~{estimatedMinutes}</span>
          <span className="workout-summary-stat-label">Est. minutes</span>
        </span>
      </div>

      {coveredMuscles.length > 0 && (
        <div className="workout-summary-muscles">
          <span className="workout-summary-muscles-label">Muscles covered</span>
          <div className="workout-summary-muscle-chips">
            {coveredMuscles.map((muscle) => (
              <span key={muscle} className="workout-summary-muscle-chip">
                {muscleLabel(muscle)}
              </span>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}