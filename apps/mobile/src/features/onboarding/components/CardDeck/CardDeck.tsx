import type { ReactNode } from 'react';
import './CardDeck.css';

interface CardDeckProps {
  /** The question card on top of the deck. */
  children: ReactNode;
}

/** The stacked deck: two tilted "ghost" cards that follow the size of the card on top of them. */
export function CardDeck({ children }: CardDeckProps) {
  return (
    <div className="card-deck">
      <div className="card-deck-ghost card-deck-ghost-back" aria-hidden="true" />
      <div className="card-deck-ghost card-deck-ghost-front" aria-hidden="true" />
      {children}
    </div>
  );
}
