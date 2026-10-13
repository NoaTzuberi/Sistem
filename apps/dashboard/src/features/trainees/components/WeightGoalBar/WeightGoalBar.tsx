import { sharedCopy, useCopy } from '@sistem/shared';
import type { WeightGoalView } from '../../data/questionnaireProfile';
import { traineesCopy } from '../../copy';
import './WeightGoalBar.css';

interface WeightGoalBarProps {
  goal: WeightGoalView;
}

/**
 * Her weight goal: where she started (her questionnaire weight), her latest weigh-in when there
 * is one, the target, and how far along she is. The coach always reads kg.
 */
export function WeightGoalBar({ goal }: WeightGoalBarProps) {
  const copy = useCopy(traineesCopy);
  const shared = useCopy(sharedCopy);
  const kg = shared.units.kg;
  const current = goal.latestKg ?? goal.startKg;

  return (
    <div className="weight-goal">
      <div className="weight-goal-ends">
        {current !== undefined && (
          <span>
            {goal.latestKg !== undefined ? copy.goalLatest : copy.goalAtStart}{' '}
            <span className="weight-goal-number">
              <bdi>{current}</bdi> {kg}
            </span>
          </span>
        )}
        <span>
          {copy.goalTarget}{' '}
          <span className="weight-goal-number">
            <bdi>{goal.targetKg}</bdi> {kg}
          </span>
        </span>
      </div>
      {/* A native progress bar: its value is data, and screen readers get it for free. */}
      <progress className="weight-goal-bar" max={1} value={goal.progress} aria-label={shared.onboardingSections.weightGoal} />
      {goal.summary && <p className="weight-goal-summary">{goal.summary}</p>}
    </div>
  );
}
