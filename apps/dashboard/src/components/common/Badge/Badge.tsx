import type { ReactNode } from 'react';
import './Badge.css';

export type BadgeTone = 'neutral' | 'accent' | 'solid' | 'alert';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
