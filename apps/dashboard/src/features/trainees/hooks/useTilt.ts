import type { PointerEvent } from 'react';

const MAX_TILT_DEG = 7;

function canTilt(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A card that leans toward a fine pointer (±7°) and carries a spotlight where the pointer is:
 * the handlers write --tilt-x / --tilt-y / --spot-x / --spot-y on the card; its CSS uses them.
 * Touch, coarse pointers and reduced motion: nothing moves.
 */
export function useTilt() {
  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse' || !canTilt()) return;
    const card = event.currentTarget;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    card.style.setProperty('--tilt-x', `${(-y * MAX_TILT_DEG * 2).toFixed(1)}deg`);
    card.style.setProperty('--tilt-y', `${(x * MAX_TILT_DEG * 2).toFixed(1)}deg`);
    card.style.setProperty('--spot-x', `${((x + 0.5) * 100).toFixed(0)}%`);
    card.style.setProperty('--spot-y', `${((y + 0.5) * 100).toFixed(0)}%`);
  }

  function onPointerLeave(event: PointerEvent<HTMLElement>) {
    const card = event.currentTarget;
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
  }

  return { onPointerMove, onPointerLeave };
}
