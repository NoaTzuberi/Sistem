import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/** Subtle fade+rise on mount, applied once per page navigation. Respects reduced motion. */
export function usePageEnter<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const animation = gsap.fromTo(
      element,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform' },
    );

    return () => {
      animation.kill();
    };
  }, []);

  return ref;
}
