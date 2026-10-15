import type { ReactNode } from 'react';
import './WeekHero.css';

interface WeekHeroProps {
  /** Its cloud's color: pink this week, amber a draft, lilac a past week, quiet an empty one. */
  tone: 'current' | 'draft' | 'past' | 'empty';
  id: string;
  /** What the panel shows ("Week 6"). */
  label: string;
  children: ReactNode;
}

/** The selected week's card (the rail's tab panel): two columns — the facts and the calendar — on a soft cloud. */
export function WeekHero({ tone, id, label, children }: WeekHeroProps) {
  return (
    <section className="pw-hero" data-tone={tone} id={id} role="tabpanel" aria-label={label} tabIndex={-1}>
      {children}
    </section>
  );
}
