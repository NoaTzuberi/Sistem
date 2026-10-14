import type { CSSProperties } from 'react';
import { isolateLtr } from '@sistem/shared';
import './StatusSpotlight.css';

export interface SpotlightWorkout {
  id: string;
  /** 'A', 'B' … by its place in the plan. */
  letter: string;
  /** Its place in the plan: its identity color (cycles through five). */
  index: number;
  state: 'done' | 'missed' | 'upcoming';
  /** Under the letter: "בוצע", "דולג", or the planned day ('—' without one). */
  caption: string;
}

export interface SpotlightView {
  /** The ring's color and the card's tint: the 48h window, a good week, a week with skips, nothing running. */
  tone: 'window' | 'late' | 'active' | 'attention' | 'idle';
  /** 0–1. */
  fill: number;
  /** In the ring's center: '31:20', '3/4', '!' or '—'. */
  center: string;
  title: string;
  text: string;
  /** This week's workouts (active / attention). */
  workouts?: SpotlightWorkout[];
  workoutsLabel?: string;
}

const SIZE = 72;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;

/** The card that says the one thing to know about her right now, with a ring for it. */
export function StatusSpotlight({ view }: { view: SpotlightView }) {
  const fill = Math.max(0, Math.min(1, view.fill));
  return (
    <section className="tqv-spotlight" data-tone={view.tone}>
      <span className="tqv-ring">
        <svg className="tqv-ring-svg" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <circle className="tqv-ring-track" cx={CENTER} cy={CENTER} r={RADIUS} />
          {/* pathLength 100: the offset is the percent still empty. Nothing at 0 — a round cap would leave a dot. */}
          {fill > 0 && (
            <circle
              className="tqv-ring-value"
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              pathLength={100}
              strokeDasharray="100"
              strokeDashoffset={100 - fill * 100}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          )}
        </svg>
        <b className="tqv-ring-center">{isolateLtr(view.center)}</b>
      </span>
      <div className="tqv-spotlight-text">
        <h3 className="tqv-spotlight-title">{view.title}</h3>
        <p className="tqv-spotlight-line">{view.text}</p>
      </div>
      {view.workouts && view.workouts.length > 0 && (
        // A computed value: how many tiles share the row.
        <ul className="tqv-workouts" aria-label={view.workoutsLabel} style={{ '--tqv-count': view.workouts.length } as CSSProperties}>
          {view.workouts.map((workout) => (
            <li key={workout.id} className="tqv-workout" data-state={workout.state} data-tone={workout.index % 5}>
              <b className="tqv-workout-letter">
                <bdi dir="ltr">{workout.letter}</bdi>
              </b>
              {workout.caption}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
