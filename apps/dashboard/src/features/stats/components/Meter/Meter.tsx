import type { CSSProperties } from 'react';
import './Meter.css';

interface MeterProps {
  /** 0–1: how much of the track is filled. */
  share: number;
  /** 0–1: where a limit is marked on the track (the 48-hour line). */
  tick?: number;
  tickLabel?: string;
  /** The fill grows in from the start (the page's entrance). */
  intro: boolean;
}

const percent = (share: number) => `${Math.max(0, Math.min(1, share)) * 100}%`;

/** A thin bar in its tile's color: a share of a whole, with an optional limit mark. Decorative — the number is in the tile. */
export function Meter({ share, tick, tickLabel, intro }: MeterProps) {
  return (
    // Computed values: the fill's length and the mark's place are the data.
    <span className={intro ? 'stat-meter is-intro' : 'stat-meter'} aria-hidden="true" style={{ '--meter-share': percent(share) } as CSSProperties}>
      <span className="stat-meter-fill" />
      {tick !== undefined && <span className="stat-meter-tick" title={tickLabel} style={{ '--meter-tick': percent(tick) } as CSSProperties} />}
    </span>
  );
}
