import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

// The card leaving: tossed sideways with a turn. The wheel screen leaving: a short fade up.
const TOSS = { x: 260, rotation: 9, duration: 0.32, ease: 'power2.in' };
const FADE_OUT = { y: -16, duration: 0.28, ease: 'power2.in' };
// The next card rising out of the deck.
const RISE = { y: 26, scale: 0.95, rotationForward: 3.5, rotationBack: -5, duration: 0.5, ease: 'power3.out' };
// The very first card, and the deck behind it fanning out.
const FIRST = { y: 40, duration: 0.7, cardDelay: 0.25, ghostDelay: 0.1, ghostStagger: 0.08 };

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** "Next" throws the card toward the end of the line: left in Hebrew, right in English. */
function forwardSign() {
  return document.documentElement.dir === 'rtl' ? -1 : 1;
}

/**
 * The motion between onboarding steps, inside the element the returned `stageRef` is put on.
 * The page renders the step `shownIndex` (not the real one): when the real step changes, the
 * element marked `data-deck-out` (the card, or the wheel screen) leaves first, only then
 * `shownIndex` follows and the new step comes in — a card (`.question-card`) rises from the
 * deck (`.card-deck-ghost`), the wheel screen's `data-deck-rise` parts fade up. Back mirrors
 * Next, and the side follows the reading direction. `isMoving` is true while the old step is
 * leaving (the page makes the stage inert). While `ready` is false (the page is still loading,
 * no step on screen) the shown step just follows: the step to resume at appears directly.
 * Reduced motion: instant swaps. Tweens are killed on unmount.
 */
export function useDeckTransition<T extends HTMLElement>(stepIndex: number, ready: boolean) {
  const stageRef = useRef<T>(null);
  const [shownIndex, setShownIndex] = useState(stepIndex);
  // True from the commit after the first step was drawn: only then is there a step to animate out.
  const [hasStepOnScreen, setHasStepOnScreen] = useState(false);
  useEffect(() => {
    setHasStepOnScreen(ready);
  }, [ready]);
  if (!hasStepOnScreen && shownIndex !== stepIndex) setShownIndex(stepIndex);
  // The step on screen and the one it replaced (null = it is the first one).
  const shown = useRef<{ from: number | null; to: number | null }>({ from: null, to: null });

  // Out: the step on screen leaves, then the shown step catches up.
  useLayoutEffect(() => {
    const leaving = stageRef.current?.querySelector<HTMLElement>('[data-deck-out]');
    if (stepIndex === shownIndex) {
      // Came back to the step on screen while it was leaving (a quick Back): put it back.
      if (leaving) gsap.set(leaving, { clearProps: 'transform,opacity' });
      return;
    }
    if (!leaving || prefersReducedMotion()) {
      setShownIndex(stepIndex);
      return;
    }
    const direction = (stepIndex > shownIndex ? 1 : -1) * forwardSign();
    const isCard = leaving.classList.contains('question-card');
    const tween = gsap.to(leaving, {
      ...(isCard
        ? { x: direction * TOSS.x, rotation: direction * TOSS.rotation, duration: TOSS.duration, ease: TOSS.ease }
        : { y: FADE_OUT.y, duration: FADE_OUT.duration, ease: FADE_OUT.ease }),
      opacity: 0,
      onComplete: () => setShownIndex(stepIndex),
    });
    return () => {
      tween.kill();
    };
  }, [stepIndex, shownIndex]);

  // In: the newly shown step arrives.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    // Only on a real change, so StrictMode's second run still knows the first card is the first.
    if (shown.current.to !== shownIndex) shown.current = { from: shown.current.to, to: shownIndex };
    const previous = shown.current.from;
    if (!stage || prefersReducedMotion()) return;

    const context = gsap.context(() => {
      const card = stage.querySelector('.question-card');
      const ghosts = stage.querySelectorAll('.card-deck-ghost');
      if (card && previous === null) {
        gsap.from(ghosts, { opacity: 0, rotation: 0, duration: FIRST.duration, ease: 'power3.out', stagger: FIRST.ghostStagger, delay: FIRST.ghostDelay, clearProps: 'transform,opacity' });
        gsap.from(card, { y: FIRST.y, opacity: 0, duration: FIRST.duration, ease: 'power3.out', delay: FIRST.cardDelay, clearProps: 'transform,opacity' });
      } else if (card) {
        const forward = previous === null || shownIndex > previous;
        gsap.fromTo(
          card,
          { x: 0, y: RISE.y, rotation: (forward ? RISE.rotationForward : RISE.rotationBack) * -forwardSign(), scale: RISE.scale, opacity: 0 },
          { y: 0, rotation: 0, scale: 1, opacity: 1, duration: RISE.duration, ease: RISE.ease, clearProps: 'transform,opacity' },
        );
        gsap.from(ghosts, { scale: 0.98, duration: RISE.duration, ease: 'power2.out', stagger: 0.05, clearProps: 'transform' });
      } else {
        gsap.fromTo(
          stage.querySelectorAll('[data-deck-rise]'),
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity' },
        );
      }
    }, stage);
    return () => context.revert();
  }, [shownIndex]);

  return { stageRef, shownIndex, isMoving: shownIndex !== stepIndex };
}
