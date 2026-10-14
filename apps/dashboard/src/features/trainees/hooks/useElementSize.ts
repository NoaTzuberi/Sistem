import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/** The element's width and height in px, kept up to date — a chart that fills its card draws for the room it has. */
export function useElementSize<T extends HTMLElement>(fallback: { width: number; height: number }): {
  ref: RefObject<T | null>;
  width: number;
  height: number;
} {
  const ref = useRef<T>(null);
  const [size, setSize] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setSize({ width: element.clientWidth || fallback.width, height: element.clientHeight || fallback.height });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fallback.width, fallback.height]);

  return { ref, ...size };
}
