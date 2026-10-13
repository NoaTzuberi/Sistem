import type { CSSProperties } from 'react';
import { fill, formatNumber, useCopy, useLanguage } from '@sistem/shared';
import { statsCopy } from '../../copy';
import './GoalsList.css';

interface GoalsListProps {
  /** Most common first. */
  goals: { id: string; label: string; count: number }[];
  /** The bars grow from the start, one after the other (the page's entrance). */
  intro: boolean;
}

/** The identity colors a row takes by its place, cycling (GoalsList.css). */
const TONES = 4;

/** How many trainees chose each goal (a trainee may have several): a colored dot and bar per goal, its count and its share of all the choices. */
export function GoalsList({ goals, intro }: GoalsListProps) {
  const language = useLanguage();
  const copy = useCopy(statsCopy);
  const highest = Math.max(1, ...goals.map((goal) => goal.count));
  const total = goals.reduce((sum, goal) => sum + goal.count, 0);

  if (goals.length === 0) return <p className="goals-list-empty">{copy.goals.empty}</p>;

  return (
    <ul className={intro ? 'goals-list is-intro' : 'goals-list'}>
      {goals.map((goal, index) => {
        const count = formatNumber(goal.count, language);
        return (
          <li key={goal.id} className="goal-row" data-tone={index % TONES} title={fill(copy.dataPoint, { label: goal.label, value: count })}>
            <span className="goal-row-dot" aria-hidden="true" />
            <span className="goal-row-label">{goal.label}</span>
            <span className="goal-row-track" aria-hidden="true">
              {/* Computed values: the bar's length is the data; its turn is its place in the entrance. */}
              <span className="goal-row-fill" style={{ '--goal-share': `${(goal.count / highest) * 100}%`, '--goal-turn': index } as CSSProperties} />
            </span>
            <span className="goal-row-count">
              <b>{count}</b>
              <small className="goal-row-share">
                <bdi>{formatNumber(goal.count / total, language, { style: 'percent', maximumFractionDigits: 0 })}</bdi>
              </small>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
