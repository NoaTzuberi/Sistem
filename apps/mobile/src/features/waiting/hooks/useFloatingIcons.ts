import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// One gentle drift per icon: different distances and tempos so the four never move
// in step. The resting place and angle of each icon are CSS (WaitingPage.css).
const FLOATS = [
  { y: -10, rotation: 3, duration: 3.6 },
  { y: 8, rotation: -2.5, duration: 4.4 },
  { y: -7, rotation: -3, duration: 3.1 },
  { y: 9, rotation: 2, duration: 4.9 },
];

/**
 * Makes the direct children of the returned ref pop in, then float slowly up and
 * down forever. Respects reduced motion (the icons just sit still).
 */
export function useFloatingIcons<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const context = gsap.context(() => {
      const icons = Array.from(container.children);

      gsap.from(icons, { opacity: 0, scale: 0.8, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.1 });

      icons.forEach((icon, index) => {
        const float = FLOATS[index % FLOATS.length];
        gsap.to(icon, {
          y: float.y,
          rotation: float.rotation,
          duration: float.duration,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          // Start each one part-way through its own cycle.
          delay: index * 0.35,
        });
      });
    }, container);

    return () => context.revert();
  }, []);

  return ref;
}
