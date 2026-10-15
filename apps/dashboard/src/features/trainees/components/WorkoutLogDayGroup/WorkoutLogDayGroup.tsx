import type { ReactNode } from 'react';
import './WorkoutLogDayGroup.css';

/** One day of her logs under a small muted date. */
export function WorkoutLogDayGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="log-day">
      <h3 className="log-day-title">{title}</h3>
      <div className="log-day-cards">{children}</div>
    </section>
  );
}
