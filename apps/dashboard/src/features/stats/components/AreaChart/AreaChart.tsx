import { useId, useState } from 'react';
import type { PointerEvent } from 'react';
import { fill, formatNumber, useCopy, useI18n } from '@sistem/shared';
import { statsCopy } from '../../copy';
import { isTimeAxisReversed, niceScale, plotArea } from '../../data/chartScales';
import { CHART_HEIGHT, ChartFrame } from '../ChartFrame/ChartFrame';
import './AreaChart.css';

export interface AreaPoint {
  key: string;
  /** Under the axis (short) and in the tooltip (full). */
  axisLabel: string;
  label: string;
  value: number;
}

interface AreaChartProps {
  /** Oldest first. */
  points: AreaPoint[];
  /** What the chart shows, for screen readers. */
  label: string;
  /** After the number in the tooltip ("trainees"). */
  unit: string;
}

/** More points than this: every second one is named under the axis. */
const DENSE_POINTS = 8;

/** One series over time: a thin pink line on a fading fill, with a crosshair and tooltip on hover. */
export function AreaChart({ points, label, unit }: AreaChartProps) {
  const { language, direction } = useI18n();
  const copy = useCopy(statsCopy);
  const gradientId = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const reversed = isTimeAxisReversed(direction);
  const last = points.length - 1;
  const scale = niceScale(Math.max(1, ...points.map((point) => point.value)));
  const labelStep = points.length > DENSE_POINTS ? 2 : 1;

  return (
    <ChartFrame
      dataLines={points.map((point) => fill(copy.dataPoint, { label: point.label, value: formatNumber(point.value, language) }))}
    >
      {(width) => {
        const area = plotArea(width, CHART_HEIGHT, reversed);
        const stepX = last > 0 ? (area.endX - area.startX) / last : 0;
        const xOf = (index: number) => area.startX + index * stepX;
        const yOf = (value: number) => area.top + (1 - value / scale.max) * (area.bottom - area.top);
        const line = points.map((point, index) => `${index ? 'L' : 'M'}${xOf(index).toFixed(1)} ${yOf(point.value).toFixed(1)}`).join(' ');
        const active = hovered !== null && points[hovered] ? hovered : null;

        function handleMove(event: PointerEvent<SVGRectElement>) {
          const bounds = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
          const x = event.clientX - bounds.left;
          const index = stepX === 0 ? 0 : Math.round((x - area.startX) / stepX);
          setHovered(Math.max(0, Math.min(last, index)));
        }

        return (
          <>
            <svg className="chart-svg" viewBox={`0 0 ${width} ${CHART_HEIGHT}`} role="img" aria-label={label} direction="ltr">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop className="area-fill-top" offset="0" />
                  <stop className="area-fill-bottom" offset="1" />
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
              {last >= 0 && (
                <>
                  <path d={`${line} L${xOf(last)} ${yOf(0)} L${xOf(0)} ${yOf(0)} Z`} fill={`url(#${gradientId})`} />
                  <path className="area-line" d={line} />
                  <circle className="area-end" cx={xOf(last)} cy={yOf(points[last].value)} r="5" />
                </>
              )}
              {points.map(
                (point, index) =>
                  (last - index) % labelStep === 0 && (
                    <text key={point.key} className="chart-axis" x={xOf(index)} y={CHART_HEIGHT - 6} textAnchor="middle">
                      {point.axisLabel}
                    </text>
                  ),
              )}
              {active !== null && (
                <>
                  <line className="area-crosshair" x1={xOf(active)} x2={xOf(active)} y1={area.top} y2={area.bottom} />
                  <circle className="area-dot" cx={xOf(active)} cy={yOf(points[active].value)} r="5" />
                </>
              )}
              <rect
                className="chart-hit"
                x={Math.min(area.startX, area.endX)}
                y="0"
                width={Math.abs(area.endX - area.startX)}
                height={CHART_HEIGHT}
                onPointerMove={handleMove}
                onPointerLeave={() => setHovered(null)}
              />
            </svg>
            {active !== null && (
              // Computed values: the tooltip follows the hovered point.
              <div className="chart-tip" role="presentation" style={{ left: xOf(active), top: yOf(points[active].value) }}>
                {points[active].label} · <b>{formatNumber(points[active].value, language)}</b> {unit}
              </div>
            )}
          </>
        );
      }}
    </ChartFrame>
  );
}
