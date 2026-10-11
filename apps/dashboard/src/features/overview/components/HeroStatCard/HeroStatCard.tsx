import type { ReactNode } from 'react';
import './HeroStatCard.css';

interface HeroStatCardProps {
  /** pink = the pink / peach cloud · lilac = the lilac / pink one. */
  tone: 'pink' | 'lilac';
  label: string;
  /** The big thin number. */
  value: string;
  caption?: string;
  className?: string;
  /** Under the caption: mini columns, glass rows. */
  children?: ReactNode;
}

/** One of the two gradient cards that carry the brand: a blurred color cloud behind one big, thin number. */
export function HeroStatCard({ tone, label, value, caption, className, children }: HeroStatCardProps) {
  const classNames = ['hero-card', `hero-card-${tone}`, className].filter(Boolean).join(' ');
  return (
    <section className={classNames}>
      <h2 className="hero-label">{label}</h2>
      <p className="hero-value">
        <bdi>{value}</bdi>
      </p>
      {caption && <p className="hero-caption">{caption}</p>}
      {children}
    </section>
  );
}
