import { useEffect, useRef } from 'react';
import { FLOW_INTRO_DONE, drawFlow } from './flowScene';
import type { FlowIntro, FlowPalette, FlowView } from './flowScene';
import './FlowBackground.css';

export type { FlowIntro };

const MAX_PIXEL_RATIO = 2;

interface FlowBackgroundProps {
  /**
   * Intro progress, owned and animated by the screen (one timeline with its own content). The
   * canvas reads it every frame, so it is changed in place — never replaced. Without it the
   * lines are fully there from the first frame.
   */
  intro?: FlowIntro;
}

// Colors and alphas come from the design tokens (packages/tokens) — nothing is hard-coded here.
function readPalette(element: Element): FlowPalette {
  const styles = getComputedStyle(element);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  const alpha = (name: string) => Number.parseFloat(token(name));
  return {
    background: token('--color-bg'),
    line: token('--color-primary'),
    glowTopAlpha: alpha('--flow-glow-top-alpha'),
    glowBottomAlpha: alpha('--flow-glow-bottom-alpha'),
    lineAlpha: alpha('--flow-line-alpha'),
    lineStrongAlpha: alpha('--flow-line-strong-alpha'),
  };
}

/**
 * Full-viewport background: Bright Snow with two soft pink corner glows and horizontal lines
 * from top to bottom that wave gently while a soft swell drifts across them. One rAF loop,
 * stopped while the page is hidden; with reduced motion it is one still frame.
 */
export function FlowBackground({ intro = FLOW_INTRO_DONE }: FlowBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const palette = readPalette(canvas);
    // Reduced motion never runs the intro: the one frame is the finished picture.
    const frameIntro = reduceMotion ? FLOW_INTRO_DONE : intro;
    let view: FlowView | undefined;
    let frameId = 0;
    let clock = 0;
    let lastTick = 0;

    function draw() {
      if (view) drawFlow(ctx!, view, palette, frameIntro, clock);
    }

    function resize() {
      const width = canvas!.clientWidth;
      const height = canvas!.clientHeight;
      if (!width || !height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      view = { width, height, dpr };
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

  return <canvas ref={canvasRef} className="flow-background" aria-hidden="true" />;
}
