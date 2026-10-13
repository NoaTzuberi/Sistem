import { useId } from 'react';
import type { CSSProperties } from 'react';
import { fill, formatNumber, useCopy, useI18n } from '@sistem/shared';
import { statsCopy } from '../../copy';
import { isTimeAxisReversed, niceScale, plotArea, roundedTopBar } from '../../data/chartScales';
import { describeChange } from '../../data/statsFormat';
import { useChartHover } from '../../hooks/useChartHover';
import { CHART_HEIGHT, ChartFrame } from '../ChartFrame/ChartFrame';
import { ChartTooltip } from '../ChartTooltip/ChartTooltip';
import './WeeklyWorkoutsChart.css';

export interface WeekBar {
  key: string;
  /** The week of the year: under the bar and in the tooltip. */
  weekNumber: number;
  /** The week's dates, for screen readers. */
  label: string;
  value: number;
}

interface WeeklyWorkoutsChartProps {
  /** Oldest first; the last bar is the current week and is solid pink. */
  bars: WeekBar[];
  /** The bars grow from the floor, one after the other (the page's entrance). */
  intro: boolean;
}

const MAX_BAR_WIDTH = 28;
const BAR_RADIUS = 8;
/** A week without workouts still gets a mark on the floor, so the row of weeks reads whole. */
const STUB_HEIGHT = 3;

/** Workouts done in each of the last weeks: gradient bars, the current week solid, a dashed average line, and a glass tooltip on hover. */
export function WeeklyWorkoutsChart({ bars, intro }: WeeklyWorkoutsChartProps) {
  const { language, direction } = useI18n();
  const copy = useCopy(statsCopy);
  const gradientId = useId();
  const { active, hover, leave } = useChartHover(bars.length);
  const reversed = isTimeAxisReversed(direction);
  const scale = niceScale(Math.max(1, ...bars.map((bar) => bar.value)));
  const current = bars.length - 1;
  const total = bars.reduce((sum, bar) => sum + bar.value, 0);
  const average = bars.length > 0 ? total / bars.length : 0;

  return (
    <ChartFrame
      empty={total === 0 ? copy.chartEmpty : null}
      dataLines={bars.map((bar) => fill(copy.dataPoint, { label: bar.label, value: formatNumber(bar.value, language) }))}
    >
      {(width) => {
        const area = plotArea(width, CHART_HEIGHT, reversed);
        const slot = (area.endX - area.startX) / bars.length;
        const barWidth = Math.min(MAX_BAR_WIDTH, Math.abs(slot) * 0.56);
        const centerOf = (index: number) => area.startX + slot * (index + 0.5);
        const yOf = (value: number) => area.top + (1 - value / scale.max) * (area.bottom - area.top);
        const floor = yOf(0);
        const topOf = (value: number) => (value > 0 ? yOf(value) : floor - STUB_HEIGHT);
        const hovered = active === null ? null : bars[active];

        return (
          <>
            <svg
              className={intro ? 'chart-svg weekly-chart is-intro' : 'chart-svg weekly-chart'}
              viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
              role="img"
              aria-label={copy.weekly.label}
              direction="ltr"
              data-hovering={active !== null || undefined}
              onPointerLeave={leave}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop className="weekly-bar-top" offset="0" />
                  <stop className="weekly-bar-bottom" offset="1" />
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
              {bars.map((bar, index) => {
                const classes = ['weekly-bar', index === current && 'weekly-bar-current', index === active && 'is-hovered'].filter(Boolean).join(' ');
                return (
                  // The bar's place in the row: its turn in the entrance (a number, not a style).
                  <g key={bar.key} className={classes} style={{ '--bar-turn': index } as CSSProperties}>
                    <path
                      className="weekly-bar-shape"
                      d={roundedTopBar(centerOf(index), topOf(bar.value), floor, barWidth, bar.value > 0 ? BAR_RADIUS : STUB_HEIGHT / 2)}
                      fill={`url(#${gradientId})`}
                    />
                  </g>
                );
              })}
              <line className="weekly-average" x1={Math.min(area.startX, area.endX)} x2={Math.max(area.startX, area.endX)} y1={yOf(average)} y2={yOf(average)} />
              {/* At the newest end of the row, written inward. */}
              <text className="weekly-average-label" x={area.endX} y={yOf(average) - 6} textAnchor={reversed ? 'start' : 'end'}>
                {fill(copy.weekly.average, { value: formatNumber(average, language, { maximumFractionDigits: 1 }) })}
              </text>
              {bars.map((bar, index) => (
                <g key={bar.key}>
                  <text className="chart-axis" x={centerOf(index)} y={CHART_HEIGHT - 6} textAnchor="middle">
                    {formatNumber(bar.weekNumber, language)}
                  </text>
                  <rect
                    className="chart-hit"
                    x={centerOf(index) - Math.abs(slot) / 2}
                    y="0"
                    width={Math.abs(slot)}
                    height={CHART_HEIGHT}
                    onPointerEnter={() => hover(index)}
                    onPointerMove={() => hover(index)}
                  />
                </g>
              ))}
            </svg>
            {hovered && active !== null && (
              <ChartTooltip
                x={centerOf(active)}
                y={topOf(hovered.value)}
                frameWidth={width}
                title={fill(copy.weekly.week, { number: formatNumber(hovered.weekNumber, language) })}
                value={formatNumber(hovered.value, language)}
                note={
                  active > 0
                    ? describeChange(hovered.value - bars[active - 1].value, copy.weekly.sinceLastWeek, copy.noChange, language)
                    : copy.weekly.unit
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
