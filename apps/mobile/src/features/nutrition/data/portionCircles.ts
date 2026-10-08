import type { PortionCounts, PortionGroup } from '@sistem/types';

// The day tracker's circles (Phase 13a+), as plain functions. One circle per planned
// portion; a planned half is a half-size circle. Marks always fill from the start, so
// only the count matters — she never says which meal a portion was.

const STEP = 0.5;

export interface Circle {
  /** 1, or 0.5 for the planned half portion at the end. */
  size: number;
  /** How much of it is marked: 0, 0.5 or 1 (never more than its size). */
  filled: number;
}

export function circlesFor(planned: number, eaten: number): Circle[] {
  const circles: Circle[] = [];
  let left = eaten;
  for (let remaining = planned; remaining > 0; remaining -= 1) {
    const size = Math.min(1, remaining);
    const filled = Math.max(0, Math.min(size, left));
    circles.push({ size, filled });
    left -= filled;
  }
  return circles;
}

/** Tap on an empty circle = one more portion; on a marked one = take the last mark back. */
export function tapCircle(circle: Circle, planned: number, eaten: number): number {
  if (circle.filled > 0) {
    const last = [...circlesFor(planned, eaten)].reverse().find((candidate) => candidate.filled > 0);
    return Math.max(0, eaten - (last?.filled ?? 0));
  }
  const next = circlesFor(planned, eaten).find((candidate) => candidate.filled < candidate.size);
  return Math.min(planned, eaten + (next ? next.size - next.filled : 0));
}

/** "½": takes back a half mark, or marks half a portion. */
export function toggleHalf(planned: number, eaten: number): number {
  if (!Number.isInteger(eaten)) return eaten - STEP;
  return Math.min(planned, eaten + STEP);
}

export function hasHalfMark(eaten: number): boolean {
  return !Number.isInteger(eaten);
}

export function withGroup(eaten: PortionCounts, group: PortionGroup, value: number): PortionCounts {
  return { ...eaten, [group]: value };
}
