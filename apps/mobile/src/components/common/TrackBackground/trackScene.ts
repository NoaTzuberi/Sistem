// The running-track scene behind login / sign-up: pure geometry + canvas drawing, no React.
// Ported from the approved prototype (docs/phase-reports/design-login.md). Everything is laid
// out in the prototype's 390 × 844 design space and scaled to the screen by `fitTrackView`.

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;
/** The track never grows past this on wide screens (a desktop browser); the gradient still fills them. */
const MAX_SCALE = 1.6;
const TAU = Math.PI * 2;

// A big stadium, tilted, partly off-screen.
const CENTER_X = 250;
const CENTER_Y = 470;
const ROTATION = (-28 * Math.PI) / 180;
const STRAIGHT = 260;
const LANES = 6; // 6 lanes = 7 lines
const INNER_RADIUS = 150;
const LANE_WIDTH = 26;
const LINE_WIDTH = 2;
const SAMPLE_STEP = 0.003;

const COS = Math.cos(ROTATION);
const SIN = Math.sin(ROTATION);

// Each lane line starts drawing a touch later than the one inside it.
const DRAW_OVERSHOOT = 1.4;
const DRAW_STAGGER = 0.065;

const TRAIL_DOTS = 44;
const TRAIL_SPACING = 0.0028;
const TRAIL_RADIUS = 2.8;
const TRAIL_TAPER = 66;
const GLOW_RADIUS = 11;
const HEAD_RADIUS = 4.2;

/** lane (0 = innermost), laps per second, where on the lap it starts (0–1). */
const RUNNERS = [
  { lane: 1, pace: 0.045, offset: 0.1 },
  { lane: 3, pace: 0.038, offset: 0.55 },
  { lane: 5, pace: 0.031, offset: 0.3 },
];

type Point = [number, number];

/** Intro progress, 0 → 1 each: the lane lines drawing on, the runners fading in. */
export interface TrackIntro {
  draw: number;
  run: number;
}

export const TRACK_INTRO_DONE: TrackIntro = { draw: 1, run: 1 };

export interface TrackPalette {
  gradientFrom: string;
  gradientTo: string;
  line: string;
  laneAlpha: number;
  laneEdgeAlpha: number;
  trailAlpha: number;
  glowAlpha: number;
}

export interface TrackView {
  /** CSS pixels. */
  width: number;
  height: number;
  dpr: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** The point at `progress` (0–1) of one lap around the stadium of this bend radius. */
function trackPoint(radius: number, progress: number): Point {
  const bend = Math.PI * radius;
  let distance = progress * (2 * STRAIGHT + 2 * bend);
  let x: number;
  let y: number;

  if (distance < STRAIGHT) {
    x = -STRAIGHT / 2 + distance;
    y = -radius;
  } else if ((distance -= STRAIGHT) < bend) {
    const angle = -Math.PI / 2 + distance / radius;
    x = STRAIGHT / 2 + Math.cos(angle) * radius;
    y = Math.sin(angle) * radius;
  } else if ((distance -= bend) < STRAIGHT) {
    x = STRAIGHT / 2 - distance;
    y = radius;
  } else {
    distance -= STRAIGHT;
    const angle = Math.PI / 2 + distance / radius;
    x = -STRAIGHT / 2 + Math.cos(angle) * radius;
    y = Math.sin(angle) * radius;
  }

  return [CENTER_X + x * COS - y * SIN, CENTER_Y + x * SIN + y * COS];
}

// The lane outlines never change: sampled once, for every screen that shows the track.
const LANE_POINTS: Point[][] = [];
for (let lane = 0; lane <= LANES; lane++) {
  const points: Point[] = [];
  for (let progress = 0; progress <= 1.0001; progress += SAMPLE_STEP) {
    points.push(trackPoint(INNER_RADIUS + lane * LANE_WIDTH, progress));
  }
  LANE_POINTS.push(points);
}

/**
 * Scales the design space to cover the screen, centered. `fitHeight` is the height the scene is
 * laid out for — the caller keeps it steady while the on-screen keyboard shrinks the canvas.
 */
export function fitTrackView(width: number, height: number, fitHeight: number, dpr: number): TrackView {
  const scale = Math.min(Math.max(width / DESIGN_WIDTH, fitHeight / DESIGN_HEIGHT), MAX_SCALE);
  return {
    width,
    height,
    dpr,
    scale,
    offsetX: (width - DESIGN_WIDTH * scale) / 2,
    offsetY: (fitHeight - DESIGN_HEIGHT * scale) / 2,
  };
}

function fillDot(ctx: CanvasRenderingContext2D, [x, y]: Point, radius: number, alpha: number) {
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
}

/** One full frame: gradient, lane lines (as far as the intro has drawn them), runners at `time` seconds. */
export function drawTrack(
  ctx: CanvasRenderingContext2D,
  view: TrackView,
  palette: TrackPalette,
  intro: TrackIntro,
  time: number,
) {
  const { width, height, dpr, scale } = view;

  ctx.globalAlpha = 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const gradient = ctx.createLinearGradient(width, 0, 0, height);
  gradient.addColorStop(0, palette.gradientFrom);
  gradient.addColorStop(1, palette.gradientTo);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * view.offsetX, dpr * view.offsetY);
  ctx.lineWidth = LINE_WIDTH;
  ctx.strokeStyle = palette.line;
  ctx.fillStyle = palette.line;

  for (let lane = 0; lane <= LANES; lane++) {
    const points = LANE_POINTS[lane];
    const drawn = Math.max(0, Math.min(1, intro.draw * DRAW_OVERSHOOT - lane * DRAW_STAGGER));
    const count = Math.floor(points.length * drawn);
    if (count < 2) continue;

    ctx.globalAlpha = lane === 0 || lane === LANES ? palette.laneEdgeAlpha : palette.laneAlpha;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < count; index++) ctx.lineTo(points[index][0], points[index][1]);
    ctx.stroke();
  }

  if (intro.run > 0) {
    for (const runner of RUNNERS) {
      const radius = INNER_RADIUS + (runner.lane + 0.5) * LANE_WIDTH;
      const progress = (runner.offset + time * runner.pace) % 1;

      for (let dot = 0; dot < TRAIL_DOTS; dot++) {
        let behind = progress - dot * TRAIL_SPACING;
        if (behind < 0) behind += 1;
        fillDot(
          ctx,
          trackPoint(radius, behind),
          TRAIL_RADIUS * (1 - dot / TRAIL_TAPER),
          palette.trailAlpha * (1 - dot / TRAIL_DOTS) * intro.run,
        );
      }

      const head = trackPoint(radius, progress);
      fillDot(ctx, head, GLOW_RADIUS, palette.glowAlpha * intro.run);
      fillDot(ctx, head, HEAD_RADIUS, intro.run);
    }
  }

  ctx.globalAlpha = 1;
}
