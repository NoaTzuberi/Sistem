import { fill, formatNumber, useCopy, useLanguage } from '@sistem/shared';
import { statsCopy } from '../../copy';
import './GoalBars.css';

interface GoalBarsProps {
  /** Most common first. */
  goals: { id: string; label: string; count: number }[];
}

/** Horizontal bars: how many trainees chose each goal (a trainee may have several). */
export function GoalBars({ goals }: GoalBarsProps) {
  const language = useLanguage();
  const copy = useCopy(statsCopy);
  const highest = Math.max(1, ...goals.map((goal) => goal.count));

  if (goals.length === 0) return <p className="goal-bars-empty">{copy.goals.empty}</p>;

  return (
    <ul className="goal-bars">
      {goals.map((goal) => {
        const count = formatNumber(goal.count, language);
        return (
          <li key={goal.id} className="goal-bar" title={fill(copy.dataPoint, { label: goal.label, value: count })}>
            <span className="goal-bar-label">{goal.label}</span>
            <span className="goal-bar-track" aria-hidden="true">
              {/* A computed value: the bar's width is the data. */}
              <span className="goal-bar-fill" style={{ inlineSize: `${(goal.count / highest) * 100}%` }} />
            </span>
            <b className="goal-bar-count">{count}</b>
          </li>
        );
      })}
    </ul>
  );
}
