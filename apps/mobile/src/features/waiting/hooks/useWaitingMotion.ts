import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

// The fly-in: each item comes from its own screen edge with a little spin.
const FLY_IN = { xPercent: 130, rotation: 20, duration: 0.8, stagger: 0.08, ease: 'back.out(1.4)' };
// The forever float. One tempo per item so the four never move in step.
const FLOAT = { y: 9, rotation: 2, durations: [2.8, 3.3, 3.7, 4.2] };

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Up and down around the resting place, forever. The first half-swing leaves from rest, so nothing jumps. */
function floatTimeline(item: HTMLElement, index: number) {
  const direction = index % 2 === 0 ? -1 : 1;
  const duration = FLOAT.durations[index % FLOAT.durations.length];

  return gsap
    .timeline()
    .to(item, { y: direction * FLOAT.y, rotation: direction * FLOAT.rotation, duration: duration / 2, ease: 'sine.out' })
    .to(item, {
      y: -direction * FLOAT.y,
      rotation: -direction * FLOAT.rotation,
      duration,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
}

/**
 * All the motion of the waiting screen, inside the element the returned ref is put on:
 * on mount the four items (`.waiting-item`, `data-side`) fly in, the center block
 * (`.waiting-content`) rises, then the footer (`.waiting-footer`), and the items float forever;
 * when `ready` turns true the "plan is ready" moment plays once. The items never react to a
 * pointer — this is the only thing that moves them. Reduced motion: nothing moves, the final
 * state shows from the first frame. Everything is killed on unmount.
 */
export function useWaitingMotion<T extends HTMLElement>(ready: boolean) {
  const rootRef = useRef<T>(null);
  const contextRef = useRef<gsap.Context | null>(null);

  // Layout effect: the starting positions are set before the first paint (no flash of the final state).
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const context = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('.waiting-item');
      const timeline = gsap.timeline();

      items.forEach((item, index) => {
        const side = item.dataset.side === 'left' ? -1 : 1;
        timeline.fromTo(
          item,
          { xPercent: side * FLY_IN.xPercent, rotation: side * FLY_IN.rotation, opacity: 0 },
          { xPercent: 0, rotation: 0, opacity: 1, duration: FLY_IN.duration, ease: FLY_IN.ease, immediateRender: true },
          index * FLY_IN.stagger,
        );
      });

      timeline
        .fromTo(
          '.waiting-content',
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', immediateRender: true },
          '-=0.4',
        )
        .fromTo(
          '.waiting-footer',
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', immediateRender: true },
          '-=0.3',
        )
        .addLabel('float');

      items.forEach((item, index) => timeline.add(floatTimeline(item, index), 'float'));
    }, root);
    contextRef.current = context;

    return () => {
      context.revert();
      contextRef.current = null;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!ready || !root || prefersReducedMotion()) return;

    contextRef.current?.add(() => {
      gsap.fromTo('.waiting-title', { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });

      // Overdue shows no countdown, so the block may not be there.
      const countdown = root.querySelector('.countdown');
      if (countdown) gsap.fromTo(countdown, { scale: 0.94 }, { scale: 1, duration: 0.5, ease: 'back.out(2.5)' });

      // The hop is on the image inside each item, so it never fights the float on the item itself.
      gsap
        .timeline()
        .to('.waiting-item .icon-slot', { y: -14, duration: 0.22, ease: 'power2.out', stagger: 0.05 })
        .to('.waiting-item .icon-slot', { y: 0, duration: 0.5, ease: 'bounce.out', stagger: 0.05 }, 0.22);
    });
  }, [ready]);

  return rootRef;
}
