import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import gsap from 'gsap';
import { WHEEL, clampIndex, clampPosition, placeItem } from '../data/wheelGeometry';
import type { WheelSide } from '../data/wheelGeometry';

// A finger that moved less than this tapped; more, it dragged.
const TAP_SLOP_PX = 6;
// Release speed (px / ms) → how many items the wheel coasts.
const INERTIA_ITEMS_PER_SPEED = 6;
const SNAP_SECONDS = 0.45;
const COAST_SECONDS = 0.6;
// Mouse wheel: one notch moves half an item; it settles once the scrolling pauses.
const WHEEL_NOTCH = 120;
const WHEEL_SETTLE_MS = 120;
// Entering the step: the wheel spins in this many items and settles on the first one.
const SPIN_IN = { items: 4, seconds: 1.1 };

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface Drag {
  startY: number;
  startPosition: number;
  lastY: number;
  lastTime: number;
  speed: number;
  moved: number;
  tappedIndex: number | null;
}

interface WheelPickerOptions {
  count: number;
  side: WheelSide;
  /** Tap on the centered item, Space or Enter. */
  onActivate: (index: number) => void;
  onCenterChange?: (index: number) => void;
}

/**
 * The curved wheel's movement: drag / swipe with inertia, mouse wheel, arrow keys, snapping to
 * the nearest item, and the spin-in on mount. It moves the items itself (transform + opacity
 * every frame, no React render); React only hears which item is at the center.
 * Reduced motion: no spin, no inertia, snaps at once. Tweens are killed on unmount.
 */
export function useWheelPicker({ count, side, onActivate, onCenterChange }: WheelPickerOptions) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLElement | null)[]>([]);
  const position = useRef({ value: 0 });
  const drag = useRef<Drag | null>(null);
  const center = useRef(0);
  const [centerIndex, setCenterIndex] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // The latest callbacks, so the listeners below never go stale.
  const callbacks = useRef({ onActivate, onCenterChange });
  useEffect(() => {
    callbacks.current = { onActivate, onCenterChange };
  });

  const layout = useCallback(() => {
    const height = wheelRef.current?.clientHeight ?? 0;
    position.current.value = clampPosition(position.current.value, count);
    items.current.forEach((element, index) => {
      if (!element) return;
      const placement = placeItem(index, position.current.value, height, side);
      element.style.transform = placement.transform;
      element.style.opacity = placement.opacity;
    });
    const next = clampIndex(Math.round(position.current.value), count);
    if (next !== center.current) {
      center.current = next;
      setCenterIndex(next);
      callbacks.current.onCenterChange?.(next);
    }
  }, [count, side]);

  const snapTo = useCallback(
    (index: number, seconds = SNAP_SECONDS) => {
      const target = clampIndex(index, count);
      gsap.killTweensOf(position.current);
      if (prefersReducedMotion()) {
        position.current.value = target;
        layout();
        return;
      }
      gsap.to(position.current, { value: target, duration: seconds, ease: 'power3.out', onUpdate: layout });
    },
    [count, layout],
  );

  // Measured before the first paint, so the items never show stacked in the corner.
  useLayoutEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;
    const measure = () => {
      setSize({ width: wheel.clientWidth, height: wheel.clientHeight });
      layout();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wheel);
    return () => observer.disconnect();
  }, [layout]);

  // Layout effect (after the measuring one): the spin starts from its first frame, no flash of the settled wheel.
  useLayoutEffect(() => {
    const target = position.current;
    if (!prefersReducedMotion()) {
      const from = Math.min(SPIN_IN.items, count - 1);
      gsap.fromTo(target, { value: from }, { value: 0, duration: SPIN_IN.seconds, ease: 'power3.out', onUpdate: layout });
      layout();
    }
    return () => {
      gsap.killTweensOf(target);
    };
    // Once, when the step opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React's onWheel is passive, and the page must not scroll under the wheel.
  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;
    let settle: number | undefined;
    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      gsap.killTweensOf(position.current);
      position.current.value += (event.deltaY / WHEEL_NOTCH) * 0.5;
      layout();
      window.clearTimeout(settle);
      settle = window.setTimeout(() => snapTo(Math.round(position.current.value)), WHEEL_SETTLE_MS);
    }
    wheel.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.clearTimeout(settle);
      wheel.removeEventListener('wheel', handleWheel);
    };
  }, [layout, snapTo]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const item = (event.target as HTMLElement).closest<HTMLElement>('[data-wheel-index]');
    drag.current = {
      startY: event.clientY,
      startPosition: position.current.value,
      lastY: event.clientY,
      lastTime: performance.now(),
      speed: 0,
      moved: 0,
      tappedIndex: item ? Number(item.dataset.wheelIndex) : null,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    gsap.killTweensOf(position.current);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    const travelled = event.clientY - current.startY;
    const now = performance.now();
    current.moved = Math.max(current.moved, Math.abs(travelled));
    current.speed = (event.clientY - current.lastY) / Math.max(1, now - current.lastTime);
    current.lastY = event.clientY;
    current.lastTime = now;
    position.current.value = current.startPosition - travelled / WHEEL.dragPxPerItem;
    layout();
  }

  function onPointerUp() {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    if (current.moved < TAP_SLOP_PX) {
      if (current.tappedIndex === null) {
        snapTo(Math.round(position.current.value));
      } else if (current.tappedIndex === center.current) {
        callbacks.current.onActivate(current.tappedIndex);
      } else {
        snapTo(current.tappedIndex);
      }
      return;
    }
    const coast = prefersReducedMotion() ? 0 : current.speed * INERTIA_ITEMS_PER_SPEED;
    snapTo(Math.round(position.current.value - coast), COAST_SECONDS);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      snapTo(center.current + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      snapTo(center.current - 1);
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      callbacks.current.onActivate(center.current);
    }
  }

  const registerItem = useCallback(
    (index: number) => (element: HTMLElement | null) => {
      items.current[index] = element;
    },
    [],
  );

  return {
    wheelRef,
    size,
    centerIndex,
    registerItem,
    wheelProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onKeyDown },
  };
}
