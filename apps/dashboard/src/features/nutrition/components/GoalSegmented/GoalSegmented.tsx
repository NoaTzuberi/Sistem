import type { NutritionGoal } from '@sistem/types';
import { formatNumber, isolateLtr, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import './GoalSegmented.css';

// The real goals, losing → keeping → gaining; each its color group (GoalSegmented.css).
const GOALS: NutritionGoal[] = ['fat_loss_aggressive', 'fat_loss', 'recomp', 'maintenance', 'muscle_gain'];
const DIRECTION: Record<NutritionGoal, 'loss' | 'keep' | 'gain'> = {
  fat_loss_aggressive: 'loss',
  fat_loss: 'loss',
  recomp: 'keep',
  maintenance: 'keep',
  muscle_gain: 'gain',
};

interface GoalSegmentedProps {
  label: string;
  value: NutritionGoal;
  /** The coach's goal percentages (settings), shown under each goal. */
  adjustments: Record<NutritionGoal, number>;
  onChange: (goal: NutritionGoal) => void;
}

/** Her nutrition goal as a segmented control, the % it moves the day under each one. */
export function GoalSegmented({ label, value, adjustments, onChange }: GoalSegmentedProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  return (
    <div className="nb-goal" role="group" aria-label={label}>
      {GOALS.map((goal) => (
        <button key={goal} className="nb-goal-option" type="button" data-direction={DIRECTION[goal]} aria-pressed={goal === value} onClick={() => onChange(goal)}>
          {shared.nutrition.goals[goal]}
          <small className="nb-goal-pct">{isolateLtr(`${formatNumber(adjustments[goal], language, { signDisplay: 'exceptZero' })}%`)}</small>
        </button>
      ))}
    </div>
  );
}
