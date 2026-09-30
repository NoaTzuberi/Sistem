import { ExercisePicker } from '../../components/ExercisePicker/ExercisePicker';
import { WorkoutExerciseRow } from '../../components/WorkoutExerciseRow/WorkoutExerciseRow';
import type { WorkoutExerciseRowValue } from '../../components/WorkoutExerciseRow/WorkoutExerciseRow';
import { YourExercisesIcon } from '../../components/icons';
import type { PublicExercise } from '../../../exercises/types';

interface AddExercisesStepProps {
  addedExerciseIds: Set<string>;
  onAdd: (exercise: PublicExercise) => void;
  onToggle: (exercise: PublicExercise) => void;
  rows: WorkoutExerciseRowValue[];
  onChangeRow: (index: number, patch: Partial<WorkoutExerciseRowValue>) => void;
  onMoveRow: (index: number, direction: -1 | 1) => void;
  onRemoveRow: (index: number) => void;
}

export function AddExercisesStep({
  addedExerciseIds,
  onAdd,
  onToggle,
  rows,
  onChangeRow,
  onMoveRow,
  onRemoveRow,
}: AddExercisesStepProps) {
  return (
    <div className="workout-builder-step-fields">
      <ExercisePicker addedExerciseIds={addedExerciseIds} onAdd={onAdd} onToggle={onToggle} />

      {rows.length > 0 && (
        <div className="workout-builder-added-exercises">
          <div className="workout-builder-panel-header">
            <span className="workout-builder-panel-icon" aria-hidden="true">
              <YourExercisesIcon />
            </span>
            <h2>Your Exercises ({rows.length})</h2>
          </div>
          <div className="workout-builder-rows">
            {rows.map((row, index) => (
              <WorkoutExerciseRow
                key={row.exercise.id}
                value={row}
                isFirst={index === 0}
                isLast={index === rows.length - 1}
                onChange={(patch) => onChangeRow(index, patch)}
                onMoveUp={() => onMoveRow(index, -1)}
                onMoveDown={() => onMoveRow(index, 1)}
                onRemove={() => onRemoveRow(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
