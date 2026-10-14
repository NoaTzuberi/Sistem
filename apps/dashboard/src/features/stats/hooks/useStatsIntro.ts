import { useEffect, useState } from 'react';

// The page's entrance (lines drawing, bars growing, numbers counting up) plays once per browser
// session: it explains the page the first time and would only be in the way after that.
// Other pages with the same entrance (a trainee's Body / Achievements tab) pass their own key.
const STORAGE_KEY = 'sistem.stats.introPlayed';
/** Longer than the longest entrance (the line: --intro-line; the last staggered bar). */
const INTRO_MS = 1800;

const playedThisLoad = new Set<string>();

function hasPlayed(key: string): boolean {
  if (playedThisLoad.has(key)) return true;
  try {
    return window.sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function markPlayed(key: string): void {
  playedThisLoad.add(key);
  try {
    window.sessionStorage.setItem(key, '1');
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
export function useStatsIntro(storageKey: string = STORAGE_KEY): boolean {
  const [isIntro, setIsIntro] = useState(() => !hasPlayed(storageKey) && !prefersReducedMotion());

  useEffect(() => {
    if (!isIntro) return;
    markPlayed(storageKey);
    const timer = window.setTimeout(() => setIsIntro(false), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [isIntro, storageKey]);

  return isIntro;
}
