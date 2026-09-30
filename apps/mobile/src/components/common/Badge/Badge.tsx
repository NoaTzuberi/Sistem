import type { HTMLAttributes, ReactNode } from 'react';
import './Badge.css';

export type BadgeVariant = 'default' | 'accent' | 'achievement' | 'success' | 'neutral' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant = 'default', className, children, ...rest }: BadgeProps) {
  const classNames = ['badge', `badge-${variant}`, className].filter(Boolean).join(' ');

  return (
    <span className={classNames} {...rest}>
      {children}
    </span>
  );
}
