import type { ReactNode } from 'react';
import './SettingsCard.css';

interface SettingsCardProps {
  number: number;
  title: string;
  /** One plain line: what this number does. */
  text: string;
  children: ReactNode;
}

/** A settings card: a dark numbered badge, the title and its one-line explanation, then the fields. */
export function SettingsCard({ number, title, text, children }: SettingsCardProps) {
  const headingId = `settings-card-${number}`;
  return (
    <section className="settings-card" aria-labelledby={headingId}>
      <header className="settings-card-head">
        <span className="settings-card-number" aria-hidden="true">
          {number}
        </span>
        <span className="settings-card-heading">
          <h2 className="settings-card-title" id={headingId}>
            {title}
          </h2>
          <span className="settings-card-text">{text}</span>
        </span>
      </header>
      {children}
    </section>
  );
}
