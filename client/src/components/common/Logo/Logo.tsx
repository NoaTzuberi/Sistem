import type { HTMLAttributes } from 'react';
import './Logo.css';

export type LogoSize = 'md' | 'lg';

interface LogoProps extends HTMLAttributes<HTMLSpanElement> {
  size?: LogoSize;
}

// The only place the brand mark lives. "SISTEM" text is a placeholder until the
// owner delivers the real logo — swap it here and every screen follows.
export function Logo({ size = 'md', className, ...rest }: LogoProps) {
  const classNames = ['logo', `logo-${size}`, className].filter(Boolean).join(' ');

  return (
    <span className={classNames} role="img" aria-label="Sistem" {...rest}>
      SISTEM
    </span>
  );
}
