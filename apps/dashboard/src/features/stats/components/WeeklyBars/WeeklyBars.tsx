import { useState } from 'react';
import { fill, formatNumber, useCopy, useI18n } from '@sistem/shared';
import { statsCopy } from '../../copy';
import { isTimeAxisReversed, niceScale, plotArea, roundedTopBar } from '../../data/chartScales';
import { CHART_HEIGHT, ChartFrame } from '../ChartFrame/ChartFrame';
import './WeeklyBars.css';

export interface WeekBar {
  key: string;
  /** Under the bar (short) and in the tooltip (the week's dates). */
  axisLabel: string;
  label: string;
  value: number;
}

interface WeeklyBarsProps {
  /** Oldest first; the last bar is the current week and is highlighted. */
  bars: WeekBar[];
  /** What the chart shows, for screen readers. */
  label: string;
  /** After the number in the tooltip ("workouts"). */
  unit: string;
}

const MAX_BAR_WIDTH = 26;
const BAR_RADIUS = 4;

/** One bar per week, the current week in full pink; hovering a bar names its week and number. */
export function WeeklyBars({ bars, label, unit }: WeeklyBarsProps) {
  const { language, direction } = useI18n();
  const copy = useCopy(statsCopy);
  const [hovered, setHovered] = useState<number | null>(null);
  const reversed = isTimeAxisReversed(direction);
  const scale = niceScale(Math.max(1, ...bars.map((bar) => bar.value)));
  const current = bars.length - 1;

  return (
    <ChartFrame dataLines={bars.map((bar) => fill(copy.dataPoint, { label: bar.label, value: formatNumber(bar.value, language) }))}>
      {(width) => {
        const area = plotArea(width, CHART_HEIGHT, reversed);
        const slot = bars.length > 0 ? (area.endX - area.startX) / bars.length : 0;
        const barWidth = Math.min(MAX_BAR_WIDTH, Math.abs(slot) * 0.5);
        const centerOf = (index: number) => area.startX + slot * (index + 0.5);
        const yOf = (value: number) => area.top + (1 - value / scale.max) * (area.bottom - area.top);
        const active = hovered !== null && bars[hovered] ? hovered : null;

        return (
          <>
            <svg className="chart-svg" viewBox={`0 0 ${width} ${CHART_HEIGHT}`} role="img" aria-label={label} direction="ltr">
              {scale.ticks.map((tick) => (
                <g key={tick}>
                  <line className="chart-grid" x1={Math.min(area.startX, area.endX)} x2={Math.max(area.startX, area.endX)} y1={yOf(tick)} y2={yOf(tick)} />
                  <text className="chart-axis" x={area.axisX} y={yOf(tick) + 4} textAnchor={area.axisAnchor}>
                    {formatNumber(tick, language)}
                  </text>
                </g>
              ))}
              {bars.map((bar, index) => (
                <g key={bar.key}>
                  {bar.value > 0 && (
                    <path
                      className={index === current ? 'weekly-bar weekly-bar-current' : 'weekly-bar'}
                      d={roundedTopBar(centerOf(index), yOf(bar.value), yOf(0), barWidth, BAR_RADIUS)}
                    />
                  )}
                  <text className="chart-axis" x={centerOf(index)} y={CHART_HEIGHT - 6} textAnchor="middle">
                    {bar.axisLabel}
                  </text>
                  {index === current && (
                    <text className="chart-value" x={centerOf(index)} y={yOf(bar.value) - 6} textAnchor="middle">
                      {formatNumber(bar.value, language)}
                    </text>
                  )}
                  <rect
                    className="chart-hit"
                    x={centerOf(index) - Math.abs(slot) / 2}
                    y="0"
                    width={Math.abs(slot)}
                    height={CHART_HEIGHT}
                    onPointerEnter={() => setHovered(index)}
                    onPointerLeave={() => setHovered((now) => (now === index ? null : now))}
                  />
                </g>
              ))}
            </svg>
            {active !== null && (
              // Computed values: the tooltip sits on the hovered bar.
              <div className="chart-tip" role="presentation" style={{ left: centerOf(active), top: yOf(bars[active].value) }}>
                {bars[active].label} · <b>{formatNumber(bars[active].value, language)}</b> {unit}
              </div>
            )}
          </>
        );
      }}
    </ChartFrame>
  );
}
