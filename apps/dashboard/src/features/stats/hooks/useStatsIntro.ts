import { useEffect, useState } from 'react';

// The page's entrance (lines drawing, bars growing, numbers counting up) plays once per browser
// session: it explains the page the first time and would only be in the way after that.
const STORAGE_KEY = 'sistem.stats.introPlayed';
/** Longer than the longest entrance (the line: --intro-line; the last staggered bar). */
const INTRO_MS = 1800;

let playedThisLoad = false;

function hasPlayed(): boolean {
  if (playedThisLoad) return true;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markPlayed(): void {
  playedThisLoad = true;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Private mode: once per page load is enough.
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * True while the entrance plays. Mount it with the content (when the numbers are there): a range
 * change or a resize re-renders that content and never restarts it. Reduced motion: never true.
 */
export function useStatsIntro(): boolean {
  const [isIntro, setIsIntro] = useState(() => !hasPlayed() && !prefersReducedMotion());

  useEffect(() => {
    if (!isIntro) return;
    markPlayed();
    const timer = window.setTimeout(() => setIsIntro(false), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [isIntro]);

  return isIntro;
}
