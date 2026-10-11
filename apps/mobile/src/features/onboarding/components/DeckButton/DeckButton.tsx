import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import './DeckButton.css';

/** `primary`: the Neon Pink pill (Next). `quiet`: muted text (Back, Skip).
 * `toggle`: a soft-pink pill, quiet while `pressed` (mark / remove the centered activity). */
export type DeckButtonVariant = 'primary' | 'quiet' | 'toggle';

interface DeckButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DeckButtonVariant;
  loading?: boolean;
  pressed?: boolean;
  children: ReactNode;
}

/** The onboarding deck's buttons. */
export function DeckButton({
  variant = 'primary',
  loading = false,
  pressed,
  disabled,
  className,
  children,
  ...rest
}: DeckButtonProps) {
  const classNames = ['deck-button', `deck-button-${variant}`, pressed ? 'deck-button-pressed' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classNames}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-pressed={pressed}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : <span className="deck-button-label">{children}</span>}
    </button>
  );
}
