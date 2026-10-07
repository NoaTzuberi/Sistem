import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * The unlock reveal (PRD §12: GSAP for achievement reveals): the elements marked
 * `data-reveal` inside the ref pop in one after another whenever `key` changes. With
 * reduced motion they simply show. Calls `onRevealed` once they are visible.
 */
export function usePopReveal<T extends HTMLElement>(key: string, onRevealed?: () => void) {
  const ref = useRef<T>(null);
  const onRevealedRef = useRef(onRevealed);
  onRevealedRef.current = onRevealed;

  // Before paint, so a fresh item never flashes in full before it pops.
  useLayoutEffect(() => {
    const container = ref.current;
    if (!container || key === '') return;
    const targets = Array.from(container.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (targets.length === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onRevealedRef.current?.();
      return;
    }
    const animation = gsap.fromTo(
      targets,
      { opacity: 0, scale: 0.6 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.45,
        ease: 'back.out(2)',
        stagger: 0.12,
        clearProps: 'transform,opacity',
        onComplete: () => onRevealedRef.current?.(),
      },
    );
    return () => {
      animation.kill();
      gsap.set(targets, { clearProps: 'transform,opacity' });
    };
  }, [key]);

  return ref;
}
