import { useState } from 'react';
import {
  defaultChartRange,
  formatChartDate,
  formatSignedChange,
  pointsInRange,
  rangeChange,
} from '@sistem/shared';
import type { ChartPoint, ChartRange } from '@sistem/shared';
import { BODY_COPY } from '../../data/bodyCopy';
import { LineChart } from '../LineChart/LineChart';
import { RangePicker } from '../RangePicker/RangePicker';
import './TrendChart.css';

interface TrendChartProps {
  /** Every point, oldest first, in the viewer's unit. */
  points: ChartPoint[];
  unit: string;
  /** What is charted, for the screen reader label ('Weight', 'Waist'). */
  title: string;
  today: string;
}

/**
 * The value at the chosen point (the latest by default), the change over the range,
 * the range toggles and the chart. Under 2 points in the range: a hint instead.
 */
export function TrendChart({ points, unit, title, today }: TrendChartProps) {
  const [range, setRange] = useState<ChartRange>(() => defaultChartRange(points, today));
  const visible = pointsInRange(points, range, today);
  const [selected, setSelected] = useState<number | null>(null);
  const selectedIndex = selected !== null && selected < visible.length ? selected : visible.length - 1;
  const shown = visible[selectedIndex];
  const change = rangeChange(visible);

  function changeRange(next: ChartRange) {
    setRange(next);
    setSelected(null);
  }

  return (
    <section className="trend-chart" aria-label={BODY_COPY.chartLabel(title)}>
      <div className="trend-chart-readout" aria-live="polite">
        {shown && (
          <>
            <span className="trend-chart-value">
              {shown.value} <span className="trend-chart-unit">{unit}</span>
            </span>
            <span className="trend-chart-date">{formatChartDate(shown.date)}</span>
          </>
        )}
        {change !== null && (
          <span className="trend-chart-change">
            {formatSignedChange(change, unit)} {BODY_COPY.rangeChange}
          </span>
        )}
      </div>
      <RangePicker value={range} onChange={changeRange} />
      {visible.length >= 2 ? (
        <LineChart points={visible} ariaLabel={BODY_COPY.chartLabel(title)} selectedIndex={selectedIndex} onSelect={setSelected} />
      ) : (
        <p className="trend-chart-empty">{BODY_COPY.chartEmpty}</p>
      )}
    </section>
  );
}
