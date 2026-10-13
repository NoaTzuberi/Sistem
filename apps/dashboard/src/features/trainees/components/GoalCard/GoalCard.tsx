import { sharedCopy, useCopy } from '@sistem/shared';
import type { GoalView } from '../../data/questionnaireProfile';
import { traineesCopy } from '../../copy';
import './GoalCard.css';

interface GoalCardProps {
  goal: GoalView;
}

/**
 * "Her goal" on a pink / peach cloud: where she is and where she wants to be, large — the
 * current weight faded, the target strong — and under it her goals, the change and its pace, and
 * how she eats. Without a weight goal: the pills only. The coach always reads kg.
 */
export function GoalCard({ goal }: GoalCardProps) {
  const copy = useCopy(traineesCopy);
  const shared = useCopy(sharedCopy);
  const kg = shared.units.kg;
  const weight = goal.weightGoal;
  const pills = [...goal.goals, weight?.changeText, weight?.rateText, goal.diet].filter((pill): pill is string => Boolean(pill));

  return (
    <section className="goal-card">
      <h2 className="goal-card-title">{copy.herGoal}</h2>

      {weight && (
        <div className="goal-weights">
          {weight.currentKg !== undefined && (
            <>
              <p className="goal-weight goal-weight-current">
                <span className="goal-weight-caption">{weight.isLatestWeighIn ? copy.goalLatest : copy.goalAtStart}</span>
                <span className="goal-weight-number">
                  <bdi>{weight.currentKg}</bdi>
                  <span className="goal-weight-unit">{kg}</span>
                </span>
              </p>
              {/* Points from where she is to where she wants to be: along the reading direction. */}
              <span className="goal-arrow flip-rtl" aria-hidden="true">
                →
              </span>
            </>
          )}
          <p className="goal-weight">
            <span className="goal-weight-caption">{copy.goalTarget}</span>
            <span className="goal-weight-number">
              <bdi>{weight.targetKg}</bdi>
              <span className="goal-weight-unit">{kg}</span>
            </span>
          </p>
        </div>
      )}

      {pills.length > 0 && (
        <ul className="goal-pills">
          {pills.map((pill) => (
            <li key={pill} className="goal-pill" dir="auto">
              {pill}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
