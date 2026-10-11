import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { TrackIntro } from '../../../components/common/TrackBackground/TrackBackground';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The login / sign-up entrance, one timeline: the track's lane lines draw on, the runners fade
 * in and the form rises. Plays on every mount (first launch, after logout, and when she moves
 * between the two screens). Reduced motion: everything is in place from the first frame.
 *
 * Returns the ref for the element that rises and the `intro` to hand to TrackBackground.
 */
export function useAuthEntrance<T extends HTMLElement>() {
  const riseRef = useRef<T>(null);
  // Starts at 0 so the very first canvas frame is already the empty track, not a flash of the full one.
  const [intro] = useState<TrackIntro>(() => (prefersReducedMotion() ? { draw: 1, run: 1 } : { draw: 0, run: 0 }));

  useLayoutEffect(() => {
    const element = riseRef.current;
    if (!element || prefersReducedMotion()) return;

    intro.draw = 0;
    intro.run = 0;
    const timeline = gsap
      .timeline({ delay: 0.2 })
      .to(intro, { draw: 1, duration: 1.4, ease: 'power2.inOut' }, 0)
      .to(intro, { run: 1, duration: 0.8, ease: 'power1.out' }, 0.9)
      .fromTo(
        element,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform', immediateRender: true },
        0.8,
      );

    return () => {
      timeline.kill();
    };
  }, [intro]);

  return { riseRef, intro };
}
