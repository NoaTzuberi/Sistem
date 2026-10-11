import { useEffect, useRef } from 'react';
import { TRACK_INTRO_DONE, drawTrack, fitTrackView } from './trackScene';
import type { TrackIntro, TrackPalette, TrackView } from './trackScene';
import './TrackBackground.css';

export type { TrackIntro };

const MAX_PIXEL_RATIO = 2;
// The runners start a little way into their laps (the prototype's first frame).
const CLOCK_START_SECONDS = 3;

interface TrackBackgroundProps {
  /**
   * Intro progress, owned and animated by the screen (one timeline with its own content). The
   * canvas reads it every frame, so it is changed in place — never replaced. Without it the
   * track is fully drawn from the first frame.
   */
  intro?: TrackIntro;
}

// Colors and alphas come from the design tokens (packages/tokens) — nothing is hard-coded here.
function readPalette(element: Element): TrackPalette {
  const styles = getComputedStyle(element);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  return {
    gradientFrom: token('--color-primary'),
    gradientTo: token('--color-primary-deep'),
    line: token('--color-on-primary'),
    laneAlpha: Number.parseFloat(token('--track-lane-alpha')),
    laneEdgeAlpha: Number.parseFloat(token('--track-lane-edge-alpha')),
    trailAlpha: Number.parseFloat(token('--track-trail-alpha')),
    glowAlpha: Number.parseFloat(token('--track-glow-alpha')),
  };
}

/**
 * Full-screen brand background: the pink gradient, a tilted running track and three runners.
 * One rAF loop, paused while the app is hidden; with reduced motion it is one still frame.
 */
export function TrackBackground({ intro = TRACK_INTRO_DONE }: TrackBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const palette = readPalette(canvas);
    let view: TrackView | undefined;
    let fitWidth = 0;
    let fitHeight = 0;
    let frameId = 0;
    let clock = 0;
    let lastTick = 0;

    function draw() {
      if (view) drawTrack(ctx!, view, palette, intro, clock + CLOCK_START_SECONDS);
    }

    function resize() {
      const width = canvas!.clientWidth;
      const height = canvas!.clientHeight;
      if (!width || !height) return;

      // The on-screen keyboard only makes the screen shorter: keep the track where it was
      // instead of re-fitting it under her thumbs. A new width (rotation) starts over.
      if (width !== fitWidth) {
        fitWidth = width;
        fitHeight = height;
      } else {
        fitHeight = Math.max(fitHeight, height);
      }

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      view = fitTrackView(width, height, fitHeight, dpr);
      // Sizing a canvas clears it.
      draw();
    }

    function tick(now: number) {
      if (lastTick) clock += (now - lastTick) / 1000;
      lastTick = now;
      draw();
      frameId = requestAnimationFrame(tick);
    }

    function start() {
      if (reduceMotion || frameId || document.hidden) return;
      // Time spent hidden is not run time.
      lastTick = 0;
      frameId = requestAnimationFrame(tick);
    }

    function stop() {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }

    function handleVisibility() {
      if (document.hidden) stop();
      else start();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    start();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [intro]);

  return <canvas ref={canvasRef} className="track-background" aria-hidden="true" />;
}
