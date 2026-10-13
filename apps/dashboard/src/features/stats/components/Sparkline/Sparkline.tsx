import { useId } from 'react';
import { useI18n } from '@sistem/shared';
import { isTimeAxisReversed } from '../../data/chartScales';
import { useElementWidth } from '../../hooks/useElementWidth';
import './Sparkline.css';

interface SparklineProps {
  /** Oldest first; null = no data for that month (nothing is drawn there). */
  values: readonly (number | null)[];
}

const HEIGHT = 34;
const INSET = 4;
const FALLBACK_WIDTH = 200;

/** The shape of the last months under a tile's number: a line in the tile's color on a fading fill, ending in a dot. Decorative. */
export function Sparkline({ values }: SparklineProps) {
  const { direction } = useI18n();
  const gradientId = useId();
  const { ref, width } = useElementWidth<HTMLSpanElement>(FALLBACK_WIDTH);
  const reversed = isTimeAxisReversed(direction);

  const known = values.flatMap((value, index) => (value === null ? [] : [{ value, index }]));
  if (known.length === 0) return null;

  const lowest = Math.min(...known.map((point) => point.value));
  const highest = Math.max(...known.map((point) => point.value));
  const last = values.length - 1;
  // The dot's radius stays inside the picture at both ends.
  const span = width - INSET * 2;
  const xOf = (index: number) => {
    const along = last > 0 ? index / last : 1;
    return INSET + (reversed ? 1 - along : along) * span;
  };
  // A flat series sits in the middle instead of on the floor.
  const yOf = (value: number) => (highest === lowest ? HEIGHT / 2 : INSET + (1 - (value - lowest) / (highest - lowest)) * (HEIGHT - INSET * 2));
  const points = known.map((point) => [xOf(point.index), yOf(point.value)] as const);
  const line = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const [endX, endY] = points[points.length - 1];

  return (
    <span className="sparkline" ref={ref} aria-hidden="true">
      <svg className="sparkline-svg" viewBox={`0 0 ${width} ${HEIGHT}`} direction="ltr">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop className="sparkline-fill-top" offset="0" />
            <stop className="sparkline-fill-bottom" offset="1" />
          </linearGradient>
        </defs>
        {points.length > 1 && (
          <>
            <path d={`${line} L${endX.toFixed(1)} ${HEIGHT} L${points[0][0].toFixed(1)} ${HEIGHT} Z`} fill={`url(#${gradientId})`} />
            <path className="sparkline-line" d={line} />
          </>
        )}
        <circle className="sparkline-end" cx={endX} cy={endY} r="3.5" />
      </svg>
    </span>
  );
}
