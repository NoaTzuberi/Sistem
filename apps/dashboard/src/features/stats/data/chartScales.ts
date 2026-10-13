import type { TextDirection } from '@sistem/shared';

/**
 * The owner's brief for this page: in Hebrew the time axis runs right → left (the newest value
 * at the reading end). NOTE: PRD §11 (Phase 15) says charts keep time left → right in both
 * languages — the body-tracking charts still do. Set this to false to make these charts follow
 * the PRD rule instead; nothing else has to change.
 */
export const TIME_AXIS_FOLLOWS_DIRECTION = true;

export function isTimeAxisReversed(direction: TextDirection): boolean {
  return TIME_AXIS_FOLLOWS_DIRECTION && direction === 'rtl';
}

const STEPS = [1, 2, 5];
const MAX_TICKS = 4;

/** A clean top for the y axis and the grid values under it: 0, step, 2 × step … (at most 4 steps). */
export function niceScale(highest: number): { max: number; ticks: number[] } {
  let magnitude = 1;
  for (;;) {
    for (const base of STEPS) {
      const step = base * magnitude;
      if (highest <= step * MAX_TICKS) {
        const count = Math.max(1, Math.ceil(highest / step));
        return { max: count * step, ticks: Array.from({ length: count + 1 }, (_, index) => index * step) };
      }
    }
    magnitude *= 10;
  }
}

/** The plot area inside a chart of `width` × `height`: the y-axis numbers sit on the side time starts from. */
export interface PlotArea {
  /** x of the first (oldest) and the last (newest) position. */
  startX: number;
  endX: number;
  top: number;
  bottom: number;
  /** Where the y-axis numbers are written, and how they are anchored. */
  axisX: number;
  axisAnchor: 'start' | 'end';
}

const AXIS_SPACE = 30;
const EDGE_SPACE = 8;
const AXIS_GAP = 6;
const TOP_SPACE = 14;
const LABEL_SPACE = 26;

export function plotArea(width: number, height: number, reversed: boolean): PlotArea {
  const top = TOP_SPACE;
  const bottom = height - LABEL_SPACE;
  return reversed
    ? { startX: width - AXIS_SPACE, endX: EDGE_SPACE, top, bottom, axisX: width - AXIS_SPACE + AXIS_GAP, axisAnchor: 'start' }
    : { startX: AXIS_SPACE, endX: width - EDGE_SPACE, top, bottom, axisX: AXIS_SPACE - AXIS_GAP, axisAnchor: 'end' };
}

/** A bar with rounded top corners, as an SVG path. */
export function roundedTopBar(centerX: number, top: number, base: number, width: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, width / 2, base - top));
  const x0 = centerX - width / 2;
  const x1 = centerX + width / 2;
  return `M${x0} ${base} V${top + r} Q${x0} ${top} ${x0 + r} ${top} H${x1 - r} Q${x1} ${top} ${x1} ${top + r} V${base} Z`;
}

/** A smooth line through the points (oldest first): each step is a cubic that leaves and arrives flat, so it never overshoots a value. */
export function smoothPath(points: readonly (readonly [number, number])[]): string {
  if (points.length === 0) return '';
  let path = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let index = 1; index < points.length; index += 1) {
    const [fromX, fromY] = points[index - 1];
    const [toX, toY] = points[index];
    const middleX = ((fromX + toX) / 2).toFixed(1);
    path += ` C${middleX} ${fromY.toFixed(1)} ${middleX} ${toY.toFixed(1)} ${toX.toFixed(1)} ${toY.toFixed(1)}`;
  }
  return path;
}
