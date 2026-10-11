import { useEffect, useRef, useState } from 'react';

// If the clip hasn't started by then, the network is too slow for a background video:
// stop the download and keep the poster.
const SLOW_NETWORK_TIMEOUT_MS = 8000;

export type ClipStatus = 'loading' | 'playing' | 'poster-only';

// Not in the TS DOM lib yet (Network Information API, Chrome/Android only).
interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

function prefersPosterOnly(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  return Boolean(
    connection?.saveData || connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g',
  );
}

/**
 * One background clip (Phase 2c rules, unchanged): it stays invisible until it really plays —
 * autoplay can be refused (iOS Low Power Mode) — and the poster covers loading, failures, data
 * saver and slow networks. New with the wheel: a clip that is only a neighbour of the centered
 * activity is preloaded but paused (`active` false); it plays when it reaches the center. The
 * element is emptied on unmount, so a clip far from the center stops downloading.
 */
export function useBackgroundClip(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<ClipStatus>(() => (prefersPosterOnly() ? 'poster-only' : 'loading'));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      // A refused autoplay keeps the poster.
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [active, status]);

  useEffect(() => {
    if (!active || status !== 'loading') return;

    // Browsers don't load media while the page is hidden (app in the background),
    // so the slow-network clock only runs while it is visible.
    let timer: number | undefined;
    function syncTimer() {
      window.clearTimeout(timer);
      timer = document.hidden
        ? undefined
        : window.setTimeout(() => setStatus('poster-only'), SLOW_NETWORK_TIMEOUT_MS);
    }

    syncTimer();
    document.addEventListener('visibilitychange', syncTimer);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', syncTimer);
    };
  }, [active, status]);

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      // After React is done: only a clip that really left the page is emptied (StrictMode
      // runs this cleanup once on a clip that stays).
      window.setTimeout(() => {
        if (!video || video.isConnected) return;
        video.pause();
        video.removeAttribute('src');
        video.load();
      }, 0);
    };
  }, []);

  return {
    videoRef,
    status,
    onPlaying: () => setStatus('playing'),
    onError: () => setStatus('poster-only'),
  };
}
