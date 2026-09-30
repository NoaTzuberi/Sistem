import { GlassSelect } from '../../components/GlassSelect/GlassSelect';
import { GoalCard } from '../../components/GoalCard/GoalCard';
import { WORKOUT_CATEGORY_OPTIONS, WORKOUT_GOAL_OPTIONS, workoutGoalIcon, workoutGoalAccent } from '../../data/workoutOptions';
import { DIFFICULTY_OPTIONS } from '../../../exercises/data/filterOptions';
import type { Difficulty } from '../../../exercises/types';
import type { WorkoutCategory, WorkoutGoal } from '../../types';

interface GoalCategoryStepProps {
  category: WorkoutCategory | '';
  onCategoryChange: (value: WorkoutCategory | '') => void;
  difficulty: Difficulty | '';
  onDifficultyChange: (value: Difficulty | '') => void;
  goal: WorkoutGoal[];
  onToggleGoal: (value: WorkoutGoal) => void;
}

export function GoalCategoryStep({
  category,
  onCategoryChange,
  difficulty,
  onDifficultyChange,
  goal,
  onToggleGoal,
}: GoalCategoryStepProps) {
  return (
    <div className="workout-builder-step-fields">
      <div className="workout-builder-row">
        <GlassSelect
          label="Category"
          placeholder="No category"
          value={category}
          onChange={(value) => onCategoryChange(value as WorkoutCategory | '')}
          options={WORKOUT_CATEGORY_OPTIONS}
        />
        <GlassSelect
          label="Difficulty"
          placeholder="No difficulty"
          value={difficulty}
          onChange={(value) => onDifficultyChange(value as Difficulty | '')}
          options={DIFFICULTY_OPTIONS}
        />
      </div>

      <div>
        <span className="workout-builder-field-label">Goal</span>
        <div className="workout-builder-goals">
          {WORKOUT_GOAL_OPTIONS.map((option) => {
            const GoalIcon = workoutGoalIcon(option.value);
            return (
              <GoalCard
                key={option.value}
                icon={<GoalIcon />}
                label={option.label}
                accent={workoutGoalAccent(option.value)}
                selected={goal.includes(option.value)}
                onClick={() => onToggleGoal(option.value)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
