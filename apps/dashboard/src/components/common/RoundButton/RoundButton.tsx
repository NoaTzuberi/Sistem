import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Link } from 'react-router-dom';
import type { To } from 'react-router-dom';
import './RoundButton.css';

interface RoundButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  /** The accessible name — the button shows only an icon. */
  label: string;
  /** floating = white on the canvas, with the panel shadow · outline = inside a white widget. */
  variant?: 'floating' | 'outline';
  /** A link instead of a button (router state travels with it). */
  to?: To;
  state?: unknown;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

/** The round icon button of the dashboard: collapse, menu, close, and the "open" arrows. */
export function RoundButton({ label, variant = 'floating', to, state, className, children, type = 'button', ...rest }: RoundButtonProps) {
  const classNames = ['round-button', `round-button-${variant}`, className].filter(Boolean).join(' ');
  if (to !== undefined) {
    return (
      <Link className={classNames} to={to} state={state} aria-label={label}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classNames} type={type} aria-label={label} {...rest}>
      {children}
    </button>
  );
}
