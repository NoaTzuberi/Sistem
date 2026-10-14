import { useId } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import type { LengthUnit, WeightUnit } from '@sistem/types';
import { buildLineChart, fill, formatChartDate, formatNumber, formatSignedChange, unitLabel, useCopy, useI18n } from '@sistem/shared';
import type { ChartPoint } from '@sistem/shared';
import { ChartTooltip } from '../../../stats/components/ChartTooltip/ChartTooltip';
import { isTimeAxisReversed, smoothPath } from '../../../stats/data/chartScales';
import { useChartHover } from '../../../stats/hooks/useChartHover';
import { useElementSize } from '../../hooks/useElementSize';
import { traineesCopy } from '../../copy';
import './BodyAreaChart.css';

interface BodyAreaChartProps {
  /** Oldest first, at least 2 (the cards show their empty panel otherwise). */
  points: ChartPoint[];
  unit: WeightUnit | LengthUnit;
  /** The chart's name for screen readers ("Weight over time"). */
  label: string;
  /** The line draws itself and the fill fades in (first view only). */
  intro: boolean;
  /** fill = grows with its card (the weight card); small = the measurements card's chart. */
  size: 'fill' | 'small';
}

const FALLBACK = { width: 520, height: 220 };
// The y-axis numbers sit on the side time starts from (the Statistics charts do the same).
const PADDING = { top: 18, right: 10, bottom: 26, left: 38 };
const AXIS_GAP = 6;

/**
 * One body value over time, in the Statistics style: a smooth line on a fading fill in the
 * card's color (--trend-color), an end dot, a crosshair and the glass tooltip on hover or arrow
 * keys. Time runs toward the reading end (right → left in Hebrew), like the Statistics charts.
 */
export function BodyAreaChart({ points, unit, label, intro, size }: BodyAreaChartProps) {
  const { language, direction } = useI18n();
  const copy = useCopy(traineesCopy).body;
  const fillId = useId();
  const reversed = isTimeAxisReversed(direction);
  const { ref, width, height } = useElementSize<HTMLDivElement>(FALLBACK);
  const { active, hover, leave } = useChartHover(points.length);
  const geometry = buildLineChart(points, { width, height, padding: PADDING }, language);
  const units = unitLabel(unit, language);

  const flipX = (x: number) => (reversed ? width - x : x);
  const marks = geometry ? geometry.points.map((point) => [flipX(point.x), point.y] as const) : [];
  const line = smoothPath(marks);
  const [firstX] = marks[0] ?? [0];
  const [endX, endY] = marks.at(-1) ?? [0, 0];
  const plotLeft = geometry ? Math.min(flipX(geometry.plot.left), flipX(geometry.plot.right)) : 0;
  const plotRight = geometry ? Math.max(flipX(geometry.plot.left), flipX(geometry.plot.right)) : 0;
  const axisX = reversed ? width - PADDING.left + AXIS_GAP : PADDING.left - AXIS_GAP;
  const hovered = active === null ? null : points[active];

  function handleMove(event: PointerEvent<SVGSVGElement>) {
    const x = event.clientX - event.currentTarget.getBoundingClientRect().left;
    let nearest = 0;
    marks.forEach(([markX], index) => {
      if (Math.abs(markX - x) < Math.abs(marks[nearest][0] - x)) nearest = index;
    });
    hover(nearest);
  }

  // ← → move the crosshair along the screen, whichever way time runs.
  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const current = active ?? points.length - 1;
    const towardRight = event.key === 'ArrowRight';
    const step = towardRight !== reversed ? 1 : -1;
    hover(Math.max(0, Math.min(points.length - 1, current + step)));
  }

  return (
    <div className={`body-area-chart body-area-chart-${size}`} ref={ref}>
      {geometry && (
        <>
          <svg
            className={intro ? 'body-area-chart-svg is-intro' : 'body-area-chart-svg'}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={label}
            direction="ltr"
            tabIndex={0}
            onPointerMove={handleMove}
            onPointerLeave={leave}
            onFocus={() => hover(active ?? points.length - 1)}
            onBlur={leave}
            onKeyDown={handleKeyDown}
          >
            <defs>
              <linearGradient id={fillId} gradientUnits="userSpaceOnUse" x1="0" y1={geometry.plot.top} x2="0" y2={geometry.plot.bottom}>
                <stop className="body-area-chart-fill-top" offset="0" />
                <stop className="body-area-chart-fill-bottom" offset="1" />
              </linearGradient>
            </defs>
            {geometry.yTicks.map((tick) => (
              <g key={tick.value}>
                <line className="body-area-chart-grid" x1={plotLeft} x2={plotRight} y1={tick.y} y2={tick.y} />
                <text className="body-area-chart-axis" x={axisX} y={tick.y + 4} textAnchor={reversed ? 'start' : 'end'}>
                  {formatNumber(tick.value, language)}
                </text>
              </g>
            ))}
            {geometry.xTicks.map((tick, index) => {
              const edge = index === 0 ? 'first' : index === geometry.xTicks.length - 1 ? 'last' : 'middle';
              const anchor = edge === 'middle' ? 'middle' : (edge === 'first') !== reversed ? 'start' : 'end';
              return (
                <text key={index} className="body-area-chart-axis" x={flipX(tick.x)} y={height - 6} textAnchor={anchor}>
                  {tick.label}
                </text>
              );
            })}
            <path
              className="body-area-chart-area"
              d={`${line} L${endX.toFixed(1)} ${geometry.plot.bottom} L${firstX.toFixed(1)} ${geometry.plot.bottom} Z`}
              fill={`url(#${fillId})`}
            />
            <path className="body-area-chart-line" d={line} pathLength={1} />
            <circle className="body-area-chart-halo" cx={endX} cy={endY} r="11" />
            <circle className="body-area-chart-end" cx={endX} cy={endY} r="5" />
            {hovered && active !== null && (
              <>
                <line className="body-area-chart-crosshair" x1={marks[active][0]} x2={marks[active][0]} y1={geometry.plot.top} y2={geometry.plot.bottom} />
                <circle className="body-area-chart-dot" cx={marks[active][0]} cy={marks[active][1]} r="6" />
              </>
            )}
          </svg>
          {hovered && active !== null && (
            <ChartTooltip
              x={marks[active][0]}
              y={marks[active][1]}
              frameWidth={width}
              title={formatChartDate(hovered.date, language)}
              value={`${formatNumber(hovered.value, language)} ${units}`}
              note={
                active > 0
                  ? fill(copy.sincePrevious, { change: formatSignedChange(hovered.value - points[active - 1].value, unit, language) })
                  : copy.firstRecord
              }
              noteTone={active > 0 ? 'change' : 'quiet'}
            />
          )}
          <ul className="visually-hidden">
            {points.map((point) => (
              <li key={point.date}>
                {formatChartDate(point.date, language)}: {formatNumber(point.value, language)} {units}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
