import { buildLineChart, useLanguage } from '@sistem/shared';
import type { ChartPoint } from '@sistem/shared';
import './Sparkline.css';

interface SparklineProps {
  points: ChartPoint[];
}

const WIDTH = 120;
const HEIGHT = 36;
const PADDING = { top: 4, right: 4, bottom: 4, left: 4 };

/** A tiny trend line for the Profile card; nothing under 2 points. Decorative. */
export function Sparkline({ points }: SparklineProps) {
  const language = useLanguage();
  const geometry = buildLineChart(points, { width: WIDTH, height: HEIGHT, padding: PADDING }, language);
  if (!geometry) return null;
  const last = geometry.points[geometry.points.length - 1];
  return (
    <svg direction="ltr" className="sparkline" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} aria-hidden="true">
      {/* Time runs left to right in both languages (owner, Phase 15); labels follow the language on screen. */}
      <path className="sparkline-line" d={geometry.path} />
      <circle className="sparkline-dot" cx={last.x} cy={last.y} r={3} />
    </svg>
  );
}
