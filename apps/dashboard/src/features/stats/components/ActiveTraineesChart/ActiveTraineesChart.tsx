import { useId } from 'react';
import type { PointerEvent } from 'react';
import { fill, formatNumber, useCopy, useI18n } from '@sistem/shared';
import { statsCopy } from '../../copy';
import { isTimeAxisReversed, niceScale, plotArea, smoothPath } from '../../data/chartScales';
import { describeChange } from '../../data/statsFormat';
import { useChartHover } from '../../hooks/useChartHover';
import { CHART_HEIGHT, ChartFrame } from '../ChartFrame/ChartFrame';
import { ChartTooltip } from '../ChartTooltip/ChartTooltip';
import './ActiveTraineesChart.css';

export interface MonthPoint {
  key: string;
  /** Under the axis (short) and in the tooltip (full). */
  axisLabel: string;
  label: string;
  /** null = a month before her first trainee: no data, nothing is drawn. */
  value: number | null;
}

interface ActiveTraineesChartProps {
  /** Oldest first. */
  points: MonthPoint[];
  /** The line draws itself and the fill fades in (the page's entrance). */
  intro: boolean;
}

/** More months than this: every second one is named under the axis. */
const DENSE_POINTS = 8;

/** Active trainees over the months: a smooth pink line on a fading fill, with a crosshair and a glass tooltip on hover. */
export function ActiveTraineesChart({ points, intro }: ActiveTraineesChartProps) {
  const { language, direction } = useI18n();
  const copy = useCopy(statsCopy);
  const lineId = useId();
  const fillId = useId();
  const reversed = isTimeAxisReversed(direction);

  // Only the months that have data are drawn and can be hovered; the axis keeps every month.
  const known = points.flatMap((point, index) => (point.value === null ? [] : [{ ...point, value: point.value, index }]));
  const { active, hover, leave } = useChartHover(known.length);
  const scale = niceScale(Math.max(1, ...known.map((point) => point.value)));
  const last = points.length - 1;
  const labelStep = points.length > DENSE_POINTS ? 2 : 1;

  return (
    <ChartFrame
      empty={known.length === 0 ? copy.chartEmpty : null}
      dataLines={known.map((point) => fill(copy.dataPoint, { label: point.label, value: formatNumber(point.value, language) }))}
    >
      {(width) => {
        const area = plotArea(width, CHART_HEIGHT, reversed);
        const stepX = last > 0 ? (area.endX - area.startX) / last : 0;
        const xOf = (index: number) => area.startX + index * stepX;
        const yOf = (value: number) => area.top + (1 - value / scale.max) * (area.bottom - area.top);
        const marks = known.map((point) => [xOf(point.index), yOf(point.value)] as const);
        const line = smoothPath(marks);
        const [firstX] = marks[0];
        const [endX, endY] = marks[marks.length - 1];
        const hovered = active === null ? null : known[active];

        function handleMove(event: PointerEvent<SVGRectElement>) {
          const bounds = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
          const x = event.clientX - bounds.left;
          let nearest = 0;
          marks.forEach(([markX], index) => {
            if (Math.abs(markX - x) < Math.abs(marks[nearest][0] - x)) nearest = index;
          });
          hover(nearest);
        }

        return (
          <>
            <svg
              className={intro ? 'chart-svg active-chart is-intro' : 'chart-svg active-chart'}
              viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
              role="img"
              aria-label={copy.active.label}
              direction="ltr"
            >
              <defs>
                {/* In the chart's own pixels: along time for the line (a flat line has no box to stretch over), top to floor for the fill. */}
                <linearGradient id={lineId} gradientUnits="userSpaceOnUse" x1={firstX} y1="0" x2={endX} y2="0">
                  <stop className="active-line-start" offset="0" />
                  <stop className="active-line-end" offset="1" />
                </linearGradient>
                <linearGradient id={fillId} gradientUnits="userSpaceOnUse" x1="0" y1={area.top} x2="0" y2={area.bottom}>
                  <stop className="active-fill-top" offset="0" />
                  <stop className="active-fill-middle" offset="0.6" />
                  <stop className="active-fill-bottom" offset="1" />
                </linearGradient>
              </defs>
              {scale.ticks.map((tick) => (
                <g key={tick}>
                  <line className="chart-grid" x1={Math.min(area.startX, area.endX)} x2={Math.max(area.startX, area.endX)} y1={yOf(tick)} y2={yOf(tick)} />
                  <text className="chart-axis" x={area.axisX} y={yOf(tick) + 4} textAnchor={area.axisAnchor}>
                    {formatNumber(tick, language)}
                  </text>
                </g>
              ))}
              {marks.length > 1 && (
                <>
                  <path className="active-area" d={`${line} L${endX.toFixed(1)} ${yOf(0)} L${firstX.toFixed(1)} ${yOf(0)} Z`} fill={`url(#${fillId})`} />
                  <path className="active-line" d={line} pathLength={1} stroke={`url(#${lineId})`} />
                </>
              )}
              <circle className="active-halo" cx={endX} cy={endY} r="12" />
              <circle className="active-end" cx={endX} cy={endY} r="5" />
              {/* A single month of data: the point says its number itself — there is no line to read it from. */}
              {marks.length === 1 && (
                <text className="active-lone-value" x={endX} y={endY - 16} textAnchor="middle">
                  {formatNumber(known[0].value, language)}
                </text>
              )}
              {points.map(
                (point, index) =>
                  (last - index) % labelStep === 0 && (
                    <text key={point.key} className="chart-axis" x={xOf(index)} y={CHART_HEIGHT - 6} textAnchor="middle">
                      {point.axisLabel}
                    </text>
                  ),
              )}
              {hovered && (
                <>
                  <line className="active-crosshair" x1={xOf(hovered.index)} x2={xOf(hovered.index)} y1={area.top} y2={area.bottom} />
                  <circle className="active-dot" cx={xOf(hovered.index)} cy={yOf(hovered.value)} r="6" />
                </>
              )}
              <rect
                className="chart-hit"
                x={Math.min(area.startX, area.endX)}
                y="0"
                width={Math.abs(area.endX - area.startX)}
                height={CHART_HEIGHT}
                onPointerMove={handleMove}
                onPointerLeave={leave}
              />
            </svg>
            {hovered && active !== null && (
              <ChartTooltip
                x={xOf(hovered.index)}
                y={yOf(hovered.value)}
                frameWidth={width}
                title={hovered.label}
                value={formatNumber(hovered.value, language)}
                note={
                  active > 0
                    ? describeChange(hovered.value - known[active - 1].value, copy.active.sinceLastMonth, copy.noChange, language)
                    : copy.active.unit
                }
                noteTone={active > 0 ? 'change' : 'quiet'}
              />
            )}
          </>
        );
      }}
    </ChartFrame>
  );
}
