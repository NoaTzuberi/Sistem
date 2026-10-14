import { useId } from 'react';
import type { ReactNode } from 'react';
import './TabCard.css';

interface TabCardProps {
  title: string;
  /** The quiet line under the title. */
  subtitle?: ReactNode;
  /** At the heading's end: a segmented control, a link. */
  actions?: ReactNode;
  /** Extra class for the card's place in its grid. */
  className?: string;
  children: ReactNode;
}

/** The glass card of a trainee's Body / Achievements / Nutrition tabs: a heading row and its content. */
export function TabCard({ title, subtitle, actions, className, children }: TabCardProps) {
  const titleId = useId();
  return (
    <section className={className ? `tab-card ${className}` : 'tab-card'} aria-labelledby={titleId}>
      <header className="tab-card-head">
        <div className="tab-card-heading">
          <h3 className="tab-card-title" id={titleId}>
            {title}
          </h3>
          {subtitle && <p className="tab-card-subtitle">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
