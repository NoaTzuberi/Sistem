// The flow-lines scene behind the dashboard login: pure geometry + canvas drawing, no React.
// Everything is laid out from the canvas size, so it fills any screen.
//
// NOT YET THE PROTOTYPE'S CURVE: the approved prototype (docs/design/coach-login.html) was not in
// the repo when this was written, so `flow` below is built from the brief's description (each
// line waves gently; a soft "energy swell" — a bulge whose center drifts slowly left and right —
// travels across them). Replace the body of `flow` — and the numbers right above it — with the
// prototype's; nothing else depends on its shape.

const TAU = Math.PI * 2;

/** Pixels between two lines, from the top of the screen to the bottom. */
const LINE_GAP = 30;
/** Every 5th line is the stronger one. */
const STRONG_EVERY = 5;

// ── flow and its numbers ──────────────────────────────────────────────────────────────────────
/** The gentle wave of every line: height in px, wavelength in px, radians per second. */
const WAVE = { height: 5, length: 520, speed: 0.45 };
/** Each line is a little further along the wave than the one above it. */
const LINE_PHASE = 0.4;
/**
 * The swell: how far lines are pushed (px), its width and height (shares of the screen), how
 * far its center drifts from the middle (share of the width) and how fast (radians per second).
 */
const SWELL = { push: 34, width: 0.2, height: 0.3, drift: 0.32, speed: 0.16 };

/**
 * How far (px, + = down) the line resting at `baseY` is moved at `x`, `time` seconds in:
 * its own wave, plus the swell pushing lines away from the middle of the bulge.
 */
export function flow(x: number, baseY: number, time: number, view: FlowView): number {
  const wave =
    Math.sin((x / WAVE.length) * TAU + time * WAVE.speed + (baseY / LINE_GAP) * LINE_PHASE) * WAVE.height;

  const centerX = view.width * (0.5 + SWELL.drift * Math.sin(time * SWELL.speed));
  const across = (x - centerX) / (view.width * SWELL.width);
  const down = (baseY - view.height / 2) / (view.height * SWELL.height);
  // A soft lens: strongest just above and below its middle, fading out in every direction.
  const swell = SWELL.push * down * Math.exp(-(across * across) - down * down);

  return wave + swell;
}
// ──────────────────────────────────────────────────────────────────────────────────────────────

const LINE_WIDTH = 1;
const STRONG_LINE_WIDTH = 1.5;
/** Pixels between two sampled points of a line. */
const SAMPLE_STEP = 12;
/** Lines start and end this far outside the screen. */
const OVERSCAN = 20;
/** The corner glows reach this far, as a share of the longer screen side. */
const CORNER_GLOW_REACH = 0.6;

/** Intro progress: the lines fading in, 0 → 1. */
export interface FlowIntro {
  fade: number;
}

export const FLOW_INTRO_DONE: FlowIntro = { fade: 1 };

export interface FlowPalette {
  background: string;
  /** The pink of the lines and glows, as '#rrggbb'. */
  line: string;
  glowTopAlpha: number;
  glowBottomAlpha: number;
  lineAlpha: number;
  lineStrongAlpha: number;
}

export interface FlowView {
  /** CSS pixels. */
  width: number;
  height: number;
  dpr: number;
}

/** '#rrggbb' at an alpha — canvas gradients need the alpha inside the color. */
function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function drawCornerGlow(
  ctx: CanvasRenderingContext2D,
  view: FlowView,
  palette: FlowPalette,
  x: number,
  y: number,
  alpha: number,
) {
  const radius = Math.max(view.width, view.height) * CORNER_GLOW_REACH;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, withAlpha(palette.line, alpha));
  glow.addColorStop(1, withAlpha(palette.line, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, view.width, view.height);
}

/** One frame: the background and its two corner glows, then the lines. */
export function drawFlow(
  ctx: CanvasRenderingContext2D,
  view: FlowView,
  palette: FlowPalette,
  intro: FlowIntro,
  time: number,
) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, view.width, view.height);

  // The design's corners: top-right and bottom-left, in Hebrew and in English.
  drawCornerGlow(ctx, view, palette, view.width, 0, palette.glowTopAlpha);
  drawCornerGlow(ctx, view, palette, 0, view.height, palette.glowBottomAlpha);

  const fade = Math.min(Math.max(intro.fade, 0), 1);
  if (fade === 0) return;

  ctx.strokeStyle = palette.line;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let line = 0; line * LINE_GAP <= view.height + LINE_GAP; line++) {
    const baseY = line * LINE_GAP;
    const isStrong = line % STRONG_EVERY === 0;
    ctx.globalAlpha = (isStrong ? palette.lineStrongAlpha : palette.lineAlpha) * fade;
    ctx.lineWidth = isStrong ? STRONG_LINE_WIDTH : LINE_WIDTH;
    ctx.beginPath();
    for (let x = -OVERSCAN; x <= view.width + OVERSCAN; x += SAMPLE_STEP) {
      const y = baseY + flow(x, baseY, time, view);
      if (x === -OVERSCAN) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
