import { Input } from '../../../../components/common/Input/Input';
import { ExerciseMedia } from '../../../exercises/components/ExerciseMedia/ExerciseMedia';
import { ChevronUpIcon, ChevronDownIcon, TrashIcon } from '../icons';
import type { ExerciseMediaFields } from '../../../exercises/types';
import './WorkoutExerciseRow.css';

/** Structurally satisfied by both PublicExercise (picker search results) and
 * WorkoutTemplateExerciseSummary (loaded from a saved template) — only the
 * fields this row actually renders. */
export interface WorkoutExerciseRowExercise {
  id: string;
  name: string;
  media: ExerciseMediaFields;
  primaryMuscles: string[];
}

export interface WorkoutExerciseRowValue {
  exercise: WorkoutExerciseRowExercise;
  defaultSets: number;
  defaultReps: string;
  defaultWeight?: number;
  restTime?: number;
  /** Present when Sets/Reps/Weight were pre-filled from the user's most recent
   * logged session for this exercise — shown as a small "last time" caption,
   * not persisted with the template itself. */
  lastLogged?: { sets: number; reps: number; weight: number };
}

interface WorkoutExerciseRowProps {
  value: WorkoutExerciseRowValue;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<WorkoutExerciseRowValue>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export function WorkoutExerciseRow({
  value,
  isFirst,
  isLast,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: WorkoutExerciseRowProps) {
  return (
    <div className="workout-exercise-row">
      <div className="workout-exercise-row-order">
        <button type="button" onClick={onMoveUp} disabled={isFirst} aria-label="Move up">
          <ChevronUpIcon />
        </button>
        <button type="button" onClick={onMoveDown} disabled={isLast} aria-label="Move down">
          <ChevronDownIcon />
        </button>
      </div>

      <div className="workout-exercise-row-media">
        <ExerciseMedia media={value.exercise.media} alt={value.exercise.name} variant="card" />
      </div>

      <div className="workout-exercise-row-info">
        <span className="workout-exercise-row-name">{value.exercise.name}</span>
        {value.lastLogged && (
          <span className="workout-exercise-row-history">
            Last time: {value.lastLogged.sets}×{value.lastLogged.reps}
            {value.lastLogged.weight > 0 ? ` @ ${value.lastLogged.weight}kg` : ''}
          </span>
        )}
      </div>

      <div className="workout-exercise-row-fields">
        <div className="workout-exercise-row-field workout-exercise-row-field-sets">
          <label>Sets</label>
          <Input
            type="number"
            min={1}
            value={value.defaultSets}
            onChange={(event) => onChange({ defaultSets: Number(event.target.value) })}
          />
        </div>
        <div className="workout-exercise-row-field workout-exercise-row-field-reps">
          <label>Reps</label>
          <Input
            value={value.defaultReps}
            placeholder="8-12"
            onChange={(event) => onChange({ defaultReps: event.target.value })}
          />
        </div>
        <div className="workout-exercise-row-field workout-exercise-row-field-weight">
          <label>Kg</label>
          <Input
            type="number"
            min={0}
            value={value.defaultWeight ?? ''}
            placeholder="—"
            onChange={(event) =>
              onChange({ defaultWeight: event.target.value === '' ? undefined : Number(event.target.value) })
            }
          />
        </div>
        <div className="workout-exercise-row-field workout-exercise-row-field-rest">
          <label>Rest</label>
          <Input
            type="number"
            min={0}
            value={value.restTime ?? ''}
            placeholder="—"
            onChange={(event) =>
              onChange({ restTime: event.target.value === '' ? undefined : Number(event.target.value) })
            }
          />
        </div>
      </div>

      <button type="button" className="workout-exercise-row-remove" onClick={onRemove} aria-label="Remove exercise">
        <TrashIcon />
      </button>
    </div>
  );
}
