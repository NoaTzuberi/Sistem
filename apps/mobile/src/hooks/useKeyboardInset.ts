import { useEffect } from 'react';

/**
 * Publishes the on-screen keyboard height as the CSS variable `--keyboard-inset`, so
 * a sticky bottom bar can sit above the keyboard.
 *
 * Android Chrome already shrinks the layout (viewport meta `interactive-widget=
 * resizes-content`), so the inset there is 0. iOS Safari only shrinks the visual
 * viewport, which is what this measures. Capacitor's Keyboard plugin (Phase 5) can
 * replace this.
 */
export function useKeyboardInset() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const root = document.documentElement;

    function update() {
      if (!viewport) return;
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      root.style.setProperty('--keyboard-inset', `${Math.round(inset)}px`);
    }

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      root.style.removeProperty('--keyboard-inset');
    };
  }, []);
}
