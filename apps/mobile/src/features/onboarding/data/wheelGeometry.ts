// The curved activity wheel as plain math (design: docs/design/onboarding-deck.html). Items sit
// on a big circle whose center is off-screen on the wheel's side; `position` is the continuous
// index at the center row.

export type WheelSide = 'left' | 'right';

export const WHEEL = {
  /** The arc line's circle. */
  radius: 380,
  /** How far the arc line's middle sits in from the wheel's side edge. */
  edgeInset: 46,
  /** The items' circle is this much wider than the arc line's. */
  itemOffset: 34,
  /** The line itself is drawn just inside the circle. */
  lineInset: 6,
  /** Angle between two neighbours. */
  stepRad: (11.5 * Math.PI) / 180,
  /** The icon pill's height: an item is centered on its row. */
  itemHeight: 46,
  /** Finger travel that moves the wheel by one item. */
  dragPxPerItem: 62,
  /** Opacity lost per item of distance from the center. */
  fadePerItem: 0.17,
  /** How far past the first / last item a drag may pull. */
  overscroll: 0.4,
  /** The arc line's half sweep. */
  lineSweepRad: 0.75,
} as const;

export interface WheelPlacement {
  transform: string;
  opacity: string;
}

/** Keeps the position inside the list (with a little pull past both ends). */
export function clampPosition(position: number, count: number): number {
  return Math.max(-WHEEL.overscroll, Math.min(count - 1 + WHEEL.overscroll, position));
}

export function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(count - 1, index));
}

/** Where item `index` sits while `position` is at the center. The item's origin is its side's middle edge. */
export function placeItem(index: number, position: number, height: number, side: WheelSide): WheelPlacement {
  const distance = index - position;
  const angle = distance * WHEEL.stepRad;
  const reach = WHEEL.radius + WHEEL.itemOffset;
  const x = WHEEL.edgeInset - WHEEL.radius + reach * Math.cos(angle);
  const y = height / 2 + reach * Math.sin(angle) - WHEEL.itemHeight / 2;
  const degrees = (angle * 180) / Math.PI;
  // On the right side everything is mirrored: measured from the right edge, turned the other way.
  const mirror = side === 'left' ? 1 : -1;
  return {
    transform: `translate(${(mirror * x).toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(mirror * degrees).toFixed(2)}deg)`,
    opacity: Math.max(0, 1 - Math.abs(distance) * WHEEL.fadePerItem).toFixed(3),
  };
}

/** The thin arc line, as an SVG path in the wheel's own pixels. */
export function arcLinePath(width: number, height: number, side: WheelSide): string {
  const radius = WHEEL.radius - WHEEL.lineInset;
  const centerX = WHEEL.edgeInset - WHEEL.radius;
  let path = '';
  for (let angle = -WHEEL.lineSweepRad; angle <= WHEEL.lineSweepRad; angle += 0.02) {
    const fromSide = centerX + radius * Math.cos(angle);
    const x = side === 'left' ? fromSide : width - fromSide;
    const y = height / 2 + radius * Math.sin(angle);
    path += `${path ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return path;
}
