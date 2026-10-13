import type { ReactNode } from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import './StatTile.css';

export type StatTone = 'pink' | 'purple' | 'orange' | 'blue';

export interface StatDelta {
  /** Which way the number moved. */
  direction: 'up' | 'down';
  /** The amount, already formatted ('+3', '4 h'). */
  text: string;
  /** A move in the unwelcome direction: shown in muted ink, not in the tile's color. */
  quiet?: boolean;
}

interface StatTileProps {
  /** The tile's identity color. */
  tone: StatTone;
  label: string;
  /** null = nothing to show yet (a dash). */
  value: number | null;
  /** Words a whole number of `value`'s unit ('85%', '24'). */
  format: (value: number) => string;
  /** A small unit after the number ("h"). */
  unit?: string;
  /** The change pill at the top; nothing without a previous value. */
  delta?: StatDelta | null;
  note?: string;
  /** The number counts up from 0 (the page's entrance). */
  intro: boolean;
  /** Under the note: a sparkline or a meter. */
  children?: ReactNode;
}

const NONE = '—';

/** One number of the Statistics page in its own color: name and change, the number, a quiet line, and a small picture of it. */
export function StatTile({ tone, label, value, format, unit, delta, note, intro, children }: StatTileProps) {
  const shown = useCountUp(value ?? 0, intro && value !== null);

  return (
    <div className="stat-tile" data-tone={tone} role="group" aria-label={label} tabIndex={0}>
      <div className="stat-tile-top">
        <span className="stat-tile-label">{label}</span>
        {delta && (
          <span className={delta.quiet ? 'stat-tile-delta stat-tile-delta-quiet' : 'stat-tile-delta'} dir="ltr">
            <span aria-hidden="true">{delta.direction === 'up' ? '▲' : '▼'}</span>
            {delta.text}
          </span>
        )}
      </div>
      <p className="stat-tile-value">
        <bdi>{value === null ? NONE : format(Math.round(shown))}</bdi>
        {unit && value !== null && <small className="stat-tile-unit">{unit}</small>}
      </p>
      {note && <p className="stat-tile-note">{note}</p>}
      {children}
    </div>
  );
}
