import type { Language } from '@sistem/types';
import { sharedCopy } from './copy';
import { dateFormat } from './i18n/intl';
import { addDaysToDate } from './format';

// The math of the body tracking line chart (weight and each measurement), shared by the
// mobile app and the dashboard. Each app draws the SVG itself from this geometry.
// Values are already in the viewer's unit; dates are 'YYYY-MM-DD'.

export type ChartRange = '1M' | '3M' | '6M' | '1Y' | 'all';

export const CHART_RANGES: ChartRange[] = ['1M', '3M', '6M', '1Y', 'all'];

const RANGE_DAYS: Record<Exclude<ChartRange, 'all'>, number> = { '1M': 30, '3M': 91, '6M': 182, '1Y': 365 };

const DAY_MS = 24 * 60 * 60 * 1000;
// Years-long charts label months, shorter ones days.
const MONTH_LABELS_AFTER_DAYS = 180;
const Y_TICK_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
const MAX_Y_TICKS = 4;
// A flat line still gets a little vertical room (in the viewer's unit).
const MIN_Y_SPAN = 1;

export interface ChartPoint {
  date: string;
  value: number;
}

export interface PlottedPoint extends ChartPoint {
  x: number;
  y: number;
}

export interface ChartSize {
  width: number;
  height: number;
  /** Room for the axis labels around the plot. */
  padding: { top: number; right: number; bottom: number; left: number };
}

export interface ChartGeometry {
  points: PlottedPoint[];
  /** The SVG path of the line. */
  path: string;
  yTicks: { value: number; y: number }[];
  xTicks: { label: string; x: number }[];
  plot: { left: number; right: number; top: number; bottom: number };
}

function dayNumber(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) / DAY_MS;
}

/** The points of a range, oldest first ('all' = every point). */
export function pointsInRange(points: ChartPoint[], range: ChartRange, today: string): ChartPoint[] {
  if (range === 'all') return points;
  const from = addDaysToDate(today, -RANGE_DAYS[range]);
  return points.filter((point) => point.date >= from);
}

/** 3 months when she has older data, else everything (it all fits). */
export function defaultChartRange(points: ChartPoint[], today: string): ChartRange {
  const oldest = points[0]?.date;
  return oldest !== undefined && oldest < addDaysToDate(today, -RANGE_DAYS['3M']) ? '3M' : 'all';
}

/** First and last value of the visible points: what changed over the range. */
export function rangeChange(points: ChartPoint[]): number | null {
  if (points.length < 2) return null;
  return points[points.length - 1].value - points[0].value;
}

function niceYDomain(min: number, max: number): { low: number; high: number; step: number } {
  const center = (min + max) / 2;
  const span = Math.max(max - min, MIN_Y_SPAN);
  const paddedMin = Math.min(min, center - span / 2);
  const paddedMax = Math.max(max, center + span / 2);
  for (const step of Y_TICK_STEPS) {
    const low = Math.floor(paddedMin / step) * step;
    const high = Math.ceil(paddedMax / step) * step;
    if ((high - low) / step <= MAX_Y_TICKS) return { low, high, step };
  }
  const step = Y_TICK_STEPS[Y_TICK_STEPS.length - 1];
  return { low: Math.floor(paddedMin / step) * step, high: Math.ceil(paddedMax / step) * step, step };
}

const DAY_LABEL: Intl.DateTimeFormatOptions = { timeZone: 'UTC', day: 'numeric', month: 'short' };
const MONTH_LABEL: Intl.DateTimeFormatOptions = { timeZone: 'UTC', month: 'short', year: '2-digit' };

/** '4 Oct' — the date of a chart point, for the readout. */
export function formatChartDate(date: string, language: Language): string {
  return dateFormat(language, DAY_LABEL).format(new Date(`${date}T00:00:00Z`));
}

/** The range buttons' labels ('1M' … 'All'). */
export function chartRangeLabel(range: ChartRange, language: Language): string {
  return sharedCopy[language].body.chartRanges[range];
}

/**
 * Lays out a line chart; null with fewer than 2 points (a line needs two). Time runs
 * left to right over the points' own span — in both languages (owner, Phase 15), the y axis gets clean ticks (not from 0 —
 * body weight never is).
 */
export function buildLineChart(points: ChartPoint[], size: ChartSize, language: Language): ChartGeometry | null {
  if (points.length < 2) return null;
  const plot = {
    left: size.padding.left,
    right: size.width - size.padding.right,
    top: size.padding.top,
    bottom: size.height - size.padding.bottom,
  };
  const firstDay = dayNumber(points[0].date);
  const lastDay = dayNumber(points[points.length - 1].date);
  const daySpan = Math.max(lastDay - firstDay, 1);
  const values = points.map((point) => point.value);
  const { low, high, step } = niceYDomain(Math.min(...values), Math.max(...values));

  const xOf = (day: number) => plot.left + ((day - firstDay) / daySpan) * (plot.right - plot.left);
  const yOf = (value: number) => plot.bottom - ((value - low) / (high - low)) * (plot.bottom - plot.top);

  const plotted = points.map((point) => ({ ...point, x: xOf(dayNumber(point.date)), y: yOf(point.value) }));
  const path = plotted.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');

  const yTicks: ChartGeometry['yTicks'] = [];
  // Rounded so 0.1 steps don't print 61.300000000000004.
  for (let value = low; value <= high + step / 2; value += step) {
    const clean = Math.round(value * 10) / 10;
    yTicks.push({ value: clean, y: yOf(clean) });
  }

  const format = dateFormat(language, daySpan > MONTH_LABELS_AFTER_DAYS ? MONTH_LABEL : DAY_LABEL);
  const xTicks = [0, 0.5, 1].map((fraction) => {
    const day = firstDay + Math.round(daySpan * fraction);
    return { label: format.format(new Date(day * DAY_MS)), x: xOf(day) };
  });

  return { points: plotted, path, yTicks, xTicks, plot };
}

/** The point nearest to an x position — the crosshair snaps to dates, not to the line. */
export function nearestPointIndex(geometry: ChartGeometry, x: number): number {
  let best = 0;
  for (let index = 1; index < geometry.points.length; index += 1) {
    if (Math.abs(geometry.points[index].x - x) < Math.abs(geometry.points[best].x - x)) best = index;
  }
  return best;
}
