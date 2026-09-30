import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Fades+rises the direct children of the returned ref, staggered, whenever `deps`
 * changes (e.g. once loading finishes and real content mounts). Respects reduced motion.
 */
export function useStaggerReveal<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return;

    const animation = gsap.fromTo(
      children,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.08, clearProps: 'transform' },
    );

    return () => {
      animation.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
