/**
 * Compresses the onboarding stock clips for mobile (Phase 2c) and extracts one
 * poster per clip. Needs ffmpeg + ffprobe on PATH.
 *
 *   npm run media:compress                     (all clips; skips existing outputs)
 *   npm run media:compress -- --only skiing    (one activity id; comma-separated for several)
 *   npm run media:compress -- --force          (re-encode even if the output exists)
 *
 * Originals in apps/mobile/src/assets/onBoardingvid are only read, never modified.
 * Output goes to apps/server/data/onboarding-media (gitignored).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  BUFFER_SIZE,
  CRF,
  MAX_BITRATE,
  MAX_FPS,
  MAX_SHORT_SIDE,
  ONBOARDING_VIDEO_SOURCES,
  OUTPUT_POSTER_DIR,
  OUTPUT_VIDEO_DIR,
  SOURCE_VIDEO_DIR,
} from '../onboardingMedia.constants';

function run(command: string, args: string[]): string {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} failed (exit ${result.status}):\n${result.stderr.slice(-2000)}`);
  }
  return result.stdout;
}

function sourceFps(file: string): number {
  const rate = run('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', file,
  ]);
  // Clips with odd container layouts print the stream more than once: use the first line.
  const firstLine = rate.split('\n').map((line) => line.trim()).find(Boolean) ?? '';
  const [num, den = '1'] = firstLine.split('/');
  const fps = Number(num) / Number(den);
  if (!Number.isFinite(fps) || fps <= 0) throw new Error(`Could not read frame rate of ${file}: "${rate}"`);
  return fps;
}

function compressVideo(source: string, output: string): void {
  // Evaluated after ffmpeg's auto-rotation, so portrait/landscape is the displayed one.
  const scale =
    `scale='if(gt(iw,ih),-2,min(${MAX_SHORT_SIDE},iw))':'if(gt(iw,ih),min(${MAX_SHORT_SIDE},ih),-2)'`;
  const filters = sourceFps(source) > MAX_FPS + 0.5 ? `${scale},fps=${MAX_FPS}` : scale;

  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', source,
    // Some clips carry a second video stream and data/audio tracks: keep only the first video.
    '-map', '0:v:0', '-an', '-sn', '-dn', '-map_metadata', '-1',
    '-vf', filters,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF),
    '-maxrate', MAX_BITRATE, '-bufsize', BUFFER_SIZE,
    '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    output,
  ]);
}

// First frame of the compressed clip, so the poster matches the moment playback starts.
function extractPoster(video: string, output: string): void {
  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', video, '-frames:v', '1', '-q:v', '3',
    output,
  ]);
}

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function parseOnly(args: string[]): string[] | undefined {
  const index = args.indexOf('--only');
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value) throw new Error('--only needs an activity id (comma-separated for several)');
  return value.split(',').map((id) => id.trim()).filter(Boolean);
}

function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = parseOnly(args);

  const ids = only ?? Object.keys(ONBOARDING_VIDEO_SOURCES);
  const unknown = ids.filter((id) => !ONBOARDING_VIDEO_SOURCES[id]);
  if (unknown.length > 0) throw new Error(`Unknown activity id(s): ${unknown.join(', ')}`);

  fs.mkdirSync(OUTPUT_VIDEO_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_POSTER_DIR, { recursive: true });

  let totalBefore = 0;
  let totalAfter = 0;
  let totalPosters = 0;

  for (const id of ids) {
    const source = path.join(SOURCE_VIDEO_DIR, ONBOARDING_VIDEO_SOURCES[id]);
    if (!fs.existsSync(source)) throw new Error(`Missing source clip for ${id}: ${source}`);

    const video = path.join(OUTPUT_VIDEO_DIR, `${id}.mp4`);
    const poster = path.join(OUTPUT_POSTER_DIR, `${id}.jpg`);
    const skipped = !force && fs.existsSync(video) && fs.existsSync(poster);

    if (!skipped) {
      compressVideo(source, video);
      extractPoster(video, poster);
    }

    const before = fs.statSync(source).size;
    const after = fs.statSync(video).size;
    const posterSize = fs.statSync(poster).size;
    totalBefore += before;
    totalAfter += after;
    totalPosters += posterSize;

    const saved = (100 * (1 - after / before)).toFixed(1);
    console.log(
      `${id.padEnd(24)} ${formatMb(before).padStart(9)} -> ${formatMb(after).padStart(8)}` +
        `  (-${saved}%)  poster ${(posterSize / 1024).toFixed(0)} KB${skipped ? '  [skipped, exists]' : ''}`,
    );
  }

  const saved = (100 * (1 - totalAfter / totalBefore)).toFixed(1);
  console.log('-'.repeat(72));
  console.log(
    `TOTAL (${ids.length})`.padEnd(24) +
      ` ${formatMb(totalBefore).padStart(9)} -> ${formatMb(totalAfter).padStart(8)}  (-${saved}%)` +
      `  posters ${formatMb(totalPosters)}`,
  );
  console.log(`Output: ${path.relative(process.cwd(), OUTPUT_VIDEO_DIR)}, ${path.relative(process.cwd(), OUTPUT_POSTER_DIR)}`);
}

main();
