import type { ReactNode } from 'react';
import './QuestionCard.css';

interface QuestionCardProps {
  /** The step's heading (StepHeading). */
  heading?: ReactNode;
  /** The step's answers. */
  children?: ReactNode;
  /** A save / load error, shown above the actions. */
  error?: string;
  /** The buttons row (DeckActions). */
  actions: ReactNode;
}

/** The white card one onboarding step lives in: heading, answers, error, actions. */
export function QuestionCard({ heading, children, error, actions }: QuestionCardProps) {
  return (
    <section className="question-card" data-deck-out>
      {heading}
      {children && <div className="question-card-body">{children}</div>}
      {error && (
        <p className="question-card-error" role="alert">
          {error}
        </p>
      )}
      {actions}
    </section>
  );
}
