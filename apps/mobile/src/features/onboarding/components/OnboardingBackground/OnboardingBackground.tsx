import { useState } from 'react';
import { useBackgroundClip } from '../../hooks/useBackgroundClip';
import type { OnboardingMedia } from '../../types';
import './OnboardingBackground.css';

interface OnboardingBackgroundProps {
  /** The clip to show (the activity at the center of the wheel); none = the gradient. */
  media: OnboardingMedia | undefined;
  /** Clips to get ready without showing them (the centered activity's two neighbours). */
  preload?: OnboardingMedia[];
}

/**
 * The onboarding screen's background, bottom to top: the activity video, the pink gradient,
 * and a see-through veil. While a clip shows, the gradient fades out and the veil fades in.
 * Only the clips passed in are mounted — everything else is unloaded.
 */
export function OnboardingBackground({ media, preload = [] }: OnboardingBackgroundProps) {
  // Clips whose poster (or video) has arrived: the gradient only gives way to something to show.
  const [ready, setReady] = useState<ReadonlySet<string>>(() => new Set());
  const clips = [...(media ? [media] : []), ...preload].filter(
    (clip, index, all) => all.findIndex((other) => other.video === clip.video) === index,
  );
  const showsVideo = media !== undefined && ready.has(media.video);

  function markReady(video: string) {
    setReady((current) => (current.has(video) ? current : new Set(current).add(video)));
  }

  return (
    <div className={'onboarding-background' + (showsVideo ? ' onboarding-background-video' : '')} aria-hidden="true">
      {clips.map((clip) => (
        <BackgroundClip
          key={clip.video}
          media={clip}
          active={clip.video === media?.video}
          onReady={() => markReady(clip.video)}
        />
      ))}
      <div className="onboarding-background-gradient" />
      <div className="onboarding-background-veil" />
    </div>
  );
}

interface BackgroundClipProps {
  media: OnboardingMedia;
  active: boolean;
  onReady: () => void;
}

// A loop restarts a moment before the real end, so the skipped opening never flashes.
const LOOP_MARGIN_SEC = 0.3;

function BackgroundClip({ media, active, onReady }: BackgroundClipProps) {
  const clip = useBackgroundClip(active);
  const startAt = media.startAt ?? 0;
  const focusClass = media.focus === 'right' ? ' onboarding-background-media-focus-right' : '';

  return (
    <div className={'onboarding-background-clip' + (active ? ' onboarding-background-clip-active' : '')}>
      <img
        className={'onboarding-background-media' + focusClass}
        src={media.poster}
        alt=""
        decoding="async"
        onLoad={onReady}
      />
      {clip.status !== 'poster-only' && (
        <video
          ref={clip.videoRef}
          className={
            'onboarding-background-media onboarding-background-video-layer' +
            focusClass +
            (clip.status === 'playing' ? ' onboarding-background-video-playing' : '')
          }
          // "#t=" makes the first play start there; the loop is sent back by onTimeUpdate.
          src={startAt > 0 ? `${media.video}#t=${startAt}` : media.video}
          loop
          muted
          playsInline
          preload="auto"
          onTimeUpdate={
            startAt > 0
              ? (event) => {
                  const video = event.currentTarget;
                  const nearEnd = Number.isFinite(video.duration) && video.currentTime > video.duration - LOOP_MARGIN_SEC;
                  if (video.currentTime < startAt || nearEnd) video.currentTime = startAt;
                }
              : undefined
          }
          onPlaying={() => {
            clip.onPlaying();
            onReady();
          }}
          onError={clip.onError}
        />
      )}
    </div>
  );
}
