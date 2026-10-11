import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { FlowIntro } from '../../../components/common/FlowBackground/FlowBackground';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The login entrance, one timeline: the background lines fade in, the brand block's children
 * rise in one after the other, and the card rises. Reduced motion: everything is in place from
 * the first frame. Killed on unmount.
 *
 * Returns the refs for the brand block and the card, and the `intro` to hand to
 * FlowBackground.
 */
export function useLoginEntrance<Brand extends HTMLElement, Card extends HTMLElement>() {
  const brandRef = useRef<Brand>(null);
  const cardRef = useRef<Card>(null);
  // Starts at 0 so the very first canvas frame is already the empty background, not a flash of the lines.
  const [intro] = useState<FlowIntro>(() => ({ fade: prefersReducedMotion() ? 1 : 0 }));

  useLayoutEffect(() => {
    const brand = brandRef.current;
    const card = cardRef.current;
    // No brand / card: the page is redirecting a coach who is already logged in.
    if (!brand || !card || prefersReducedMotion()) return;

    intro.fade = 0;
    const timeline = gsap
      .timeline()
      .to(intro, { fade: 1, duration: 1.4, ease: 'power1.out' }, 0)
      .fromTo(
        Array.from(brand.children),
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.09,
          clearProps: 'transform',
          immediateRender: true,
        },
        0.2,
      )
      .fromTo(
        card,
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform', immediateRender: true },
        0.45,
      );

    return () => {
      timeline.kill();
      // A kill mid-way must not leave the form invisible (dev double-mount, fast re-render).
      gsap.set([card, ...Array.from(brand.children)], { clearProps: 'opacity,transform' });
      intro.fade = 1;
    };
  }, [intro]);

  return { brandRef, cardRef, intro };
}
