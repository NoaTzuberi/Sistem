import type { ReactNode } from 'react';
import './StatTile.css';

interface StatTileProps {
  label: string;
  /** The big thin number, already formatted. */
  value: string;
  /** A small unit after the number ("h"). */
  unit?: string;
  /** A signed change ('+3'), shown before the note in pink. */
  change?: string | null;
  note?: ReactNode;
}

/** One number of the Statistics page: its name, the number, and a quiet line under it. */
export function StatTile({ label, value, unit, change, note }: StatTileProps) {
  return (
    <div className="stat-tile">
      <dt className="stat-tile-label">{label}</dt>
      <dd className="stat-tile-value">
        <bdi>{value}</bdi>
        {unit && <small className="stat-tile-unit">{unit}</small>}
      </dd>
      {(change || note) && (
        <dd className="stat-tile-note">
          {change && (
            <bdi className="stat-tile-change" dir="ltr">
              {change}
            </bdi>
          )}{' '}
          {note}
        </dd>
      )}
    </div>
  );
}
