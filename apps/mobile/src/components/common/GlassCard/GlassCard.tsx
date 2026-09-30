import type { HTMLAttributes, ReactNode } from 'react';
import './GlassCard.css';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'flat';
}

export function GlassCard({ className, children, variant = 'default', ...rest }: GlassCardProps) {
  const classNames = ['glass-card', variant === 'flat' && 'glass-card--flat', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}
