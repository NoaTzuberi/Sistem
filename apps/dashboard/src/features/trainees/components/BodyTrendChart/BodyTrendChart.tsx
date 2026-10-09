import type { LengthUnit, WeightUnit } from '@sistem/types';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { buildLineChart, CHART_RANGES, defaultChartRange, fill, formatChartDate, formatSignedChange, nearestPointIndex, pointsInRange, rangeChange, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import type { ChartPoint, ChartRange } from '@sistem/shared';
import './BodyTrendChart.css';
import { traineesCopy } from '../../copy';

interface BodyTrendChartProps {
  /** Every point, oldest first, in kg / cm. */
  points: ChartPoint[];
  unit: WeightUnit | LengthUnit;
  title: string;
  today: string;
}

const HEIGHT = 220;
const PADDING = { top: 12, right: 16, bottom: 26, left: 44 };
const MAX_DOTS = 60;
const RANGE_LABELS: Record<ChartRange, string> = { '1M': '1M', '3M': '3M', '6M': '6M', '1Y': '1Y', all: 'All' };

/**
 * One body value over time — the same chart math as the mobile app (@sistem/shared).
 * Hover or arrow keys move the crosshair; the value shows above the chart.
 */
export function BodyTrendChart({ points, unit, title, today }: BodyTrendChartProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [range, setRange] = useState<ChartRange>(() => defaultChartRange(points, today));
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const visible = pointsInRange(points, range, today);
  const selectedIndex = selected !== null && selected < visible.length ? selected : visible.length - 1;
  const shown = visible[selectedIndex];
  const change = rangeChange(visible);
  const geometry = width > 0 ? buildLineChart(visible, { width, height: HEIGHT, padding: PADDING }, language) : null;
  const marker = geometry?.points[selectedIndex];

  function selectAt(event: PointerEvent<SVGSVGElement>) {
    if (!geometry) return;
    const box = event.currentTarget.getBoundingClientRect();
    setSelected(nearestPointIndex(geometry, event.clientX - box.left));
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === 'ArrowLeft') setSelected(Math.max(0, selectedIndex - 1));
    else if (event.key === 'ArrowRight') setSelected(Math.min(visible.length - 1, selectedIndex + 1));
    else return;
    event.preventDefault();
  }

  return (
    <section className="body-trend-chart" aria-label={fill(copy.overTime, { title })}>
      <div className="body-trend-chart-header">
        <h3 className="body-trend-chart-title">{title}</h3>
        <div className="body-trend-chart-ranges" role="group" aria-label={copy.timeRange}>
          {CHART_RANGES.map((option) => (
            <button
              key={option}
              type="button"
              className="body-trend-chart-range"
              aria-pressed={option === range}
              onClick={() => {
                setRange(option);
                setSelected(null);
              }}
            >
              {RANGE_LABELS[option]}
            </button>
          ))}
        </div>
      </div>
      <p className="body-trend-chart-readout" aria-live="polite">
        {shown ? (
          <>
            <strong>
              {shown.value} {shared.units[unit]}
            </strong>{' '}
            · {formatChartDate(shown.date, language)}
            {change !== null && <span className="body-trend-chart-change">
                {' · '}
                {formatSignedChange(change, unit, language)} {copy.overRange}
              </span>}
          </>
        ) : (
          copy.nothingLogged
        )}
      </p>
      <div className="body-trend-chart-plot" ref={containerRef}>
        {visible.length < 2 ? (
          <p className="body-trend-chart-empty">{copy.notEnoughTrend}</p>
        ) : (
          geometry && (
            <svg direction="ltr"
              width={width}
              height={HEIGHT}
              viewBox={`0 0 ${width} ${HEIGHT}`}
              role="img"
              aria-label={fill(copy.overTime, { title })}
              tabIndex={0}
              onPointerMove={selectAt}
              onPointerDown={selectAt}
              onKeyDown={handleKeyDown}
            >
              {/* Time runs left to right in both languages (owner, Phase 15); labels follow the language on screen. */}
              {geometry.yTicks.map((tick) => (
                <g key={tick.value}>
                  <line className="body-trend-chart-grid" x1={geometry.plot.left} x2={geometry.plot.right} y1={tick.y} y2={tick.y} />
                  <text className="body-trend-chart-axis" x={geometry.plot.left - 6} y={tick.y} textAnchor="end" dominantBaseline="middle">
                    {tick.value}
                  </text>
                </g>
              ))}
              {geometry.xTicks.map((tick, index) => (
                <text
                  key={index}
                  className="body-trend-chart-axis"
                  x={tick.x}
                  y={HEIGHT - 6}
                  textAnchor={index === 0 ? 'start' : index === geometry.xTicks.length - 1 ? 'end' : 'middle'}
                >
                  {tick.label}
                </text>
              ))}
              {marker && (
                <line className="body-trend-chart-crosshair" x1={marker.x} x2={marker.x} y1={geometry.plot.top} y2={geometry.plot.bottom} />
              )}
              <path className="body-trend-chart-line" d={geometry.path} />
              {geometry.points.length <= MAX_DOTS &&
                geometry.points.map((point) => <circle key={point.date} className="body-trend-chart-dot" cx={point.x} cy={point.y} r={4} />)}
              {marker && <circle className="body-trend-chart-dot body-trend-chart-dot-selected" cx={marker.x} cy={marker.y} r={6} />}
            </svg>
          )
        )}
      </div>
    </section>
  );
}
