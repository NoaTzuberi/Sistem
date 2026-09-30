import { useEffect, useState } from 'react';
import type { OnboardingMedia } from '../../types';
import './StepVideoBackground.css';

// If the clip hasn't started by then, the network is too slow for a background video:
// stop the download and keep the poster.
const SLOW_NETWORK_TIMEOUT_MS = 8000;

type VideoStatus = 'loading' | 'playing' | 'poster-only';

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

interface StepVideoBackgroundProps {
  media: OnboardingMedia | undefined;
}

export function StepVideoBackground({ media }: StepVideoBackgroundProps) {
  if (!media) {
    return null;
  }

  // Keyed by clip, so every clip starts again from its poster.
  return <StepVideo key={media.video} media={media} />;
}

function StepVideo({ media }: { media: OnboardingMedia }) {
  const [status, setStatus] = useState<VideoStatus>(() => (prefersPosterOnly() ? 'poster-only' : 'loading'));

  useEffect(() => {
    if (status !== 'loading') return;

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
  }, [status]);

  return (
    <div className="step-video-background">
      <img className="step-video-background-media" src={media.poster} alt="" decoding="async" />
      {/* Mounted only for the previewed activity, so each clip is fetched on demand.
          It stays invisible until it really plays (autoplay can be refused, e.g. iOS
          Low Power Mode) — the poster covers loading, failures and slow networks. */}
      {status !== 'poster-only' && (
        <video
          className={
            'step-video-background-media step-video-background-video' +
            (status === 'playing' ? ' step-video-background-video-playing' : '')
          }
          src={media.video}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onPlaying={() => setStatus('playing')}
          onError={() => setStatus('poster-only')}
        />
      )}
    </div>
  );
}
