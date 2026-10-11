import type { ReactNode } from 'react';
import './DeckActions.css';

interface DeckActionsProps {
  /** The quiet button on the starting side (Back / Cancel); its place stays empty without one. */
  start?: ReactNode;
  /** The buttons on the ending side (Skip, Next). */
  children: ReactNode;
}

/** The buttons row at the bottom of a step. */
export function DeckActions({ start, children }: DeckActionsProps) {
  return (
    <div className="deck-actions">
      <div className="deck-actions-start">{start}</div>
      <div className="deck-actions-end">{children}</div>
    </div>
  );
}
