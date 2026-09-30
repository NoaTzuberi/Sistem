/**
 * Uploads the compressed onboarding clips + posters (output of media:compress) to
 * Cloudinary and writes the manifest the mobile onboarding reads (Phase 2c).
 *
 *   npm run media:upload                     (all; skips media unchanged since the last upload)
 *   npm run media:upload -- --only skiing    (one activity id; comma-separated for several)
 *   npm run media:upload -- --force          (re-upload even if unchanged)
 *
 * Needs CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in apps/server/.env.
 * Onboarding stock footage is not personal data, so it is a public upload; user photos
 * (Phases 9–10) use authenticated delivery instead.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../../../config/env';
import {
  CLOUDINARY_POSTER_FOLDER,
  CLOUDINARY_VIDEO_FOLDER,
  MANIFEST_PATH,
  ONBOARDING_VIDEO_SOURCES,
  OUTPUT_POSTER_DIR,
  OUTPUT_VIDEO_DIR,
} from '../onboardingMedia.constants';
import type { OnboardingMediaEntry, OnboardingMediaManifest } from '../onboardingMedia.types';

function md5(file: string): string {
  return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
}

function readManifest(): OnboardingMediaManifest {
  if (!fs.existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as OnboardingMediaManifest;
}

// Keeps the activity order from the constants, so re-runs produce stable diffs.
function writeManifest(manifest: OnboardingMediaManifest): void {
  const ordered: OnboardingMediaManifest = {};
  for (const id of Object.keys(ONBOARDING_VIDEO_SOURCES)) {
    if (manifest[id]) ordered[id] = manifest[id];
  }
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(ordered, null, 2)}\n`);
}

async function upload(file: string, folder: string, publicName: string, resourceType: 'video' | 'image') {
  const result = await cloudinary.uploader.upload(file, {
    resource_type: resourceType,
    // Full path in the public id works in both fixed and dynamic folder mode;
    // asset_folder places it in the Media Library folder in dynamic mode.
    public_id: `${folder}/${publicName}`,
    asset_folder: folder,
    overwrite: true,
    invalidate: true,
    unique_filename: false,
    use_filename: false,
  });
  // secure_url carries the version (v123…), so an overwritten file is never served stale.
  return result.secure_url;
}

function parseOnly(args: string[]): string[] | undefined {
  const index = args.indexOf('--only');
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value) throw new Error('--only needs an activity id (comma-separated for several)');
  return value.split(',').map((id) => id.trim()).filter(Boolean);
}

async function main() {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  const missing = [
    !cloudName && 'CLOUDINARY_CLOUD_NAME',
    !apiKey && 'CLOUDINARY_API_KEY',
    !apiSecret && 'CLOUDINARY_API_SECRET',
  ].filter(Boolean);
  if (missing.length > 0) throw new Error(`Missing in apps/server/.env: ${missing.join(', ')}`);
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const ids = parseOnly(args) ?? Object.keys(ONBOARDING_VIDEO_SOURCES);
  const unknown = ids.filter((id) => !ONBOARDING_VIDEO_SOURCES[id]);
  if (unknown.length > 0) throw new Error(`Unknown activity id(s): ${unknown.join(', ')}`);

  const manifest = readManifest();
  let uploaded = 0;
  let skipped = 0;

  for (const id of ids) {
    const videoFile = path.join(OUTPUT_VIDEO_DIR, `${id}.mp4`);
    const posterFile = path.join(OUTPUT_POSTER_DIR, `${id}.jpg`);
    if (!fs.existsSync(videoFile) || !fs.existsSync(posterFile)) {
      throw new Error(`Missing compressed media for ${id} — run npm run media:compress first`);
    }

    const previous = manifest[id];
    const videoMd5 = md5(videoFile);
    const posterMd5 = md5(posterFile);
    const videoChanged = force || previous?.videoMd5 !== videoMd5;
    const posterChanged = force || previous?.posterMd5 !== posterMd5;

    if (!videoChanged && !posterChanged) {
      skipped += 1;
      console.log(`${id.padEnd(24)} skipped (unchanged)`);
      continue;
    }

    const entry: OnboardingMediaEntry = {
      video: videoChanged || !previous
        ? await upload(videoFile, CLOUDINARY_VIDEO_FOLDER, id, 'video')
        : previous.video,
      poster: posterChanged || !previous
        ? await upload(posterFile, CLOUDINARY_POSTER_FOLDER, id, 'image')
        : previous.poster,
      videoMd5,
      posterMd5,
    };
    manifest[id] = entry;
    // Saved after every item, so an interrupted run keeps what already succeeded.
    writeManifest(manifest);
    uploaded += 1;
    console.log(`${id.padEnd(24)} uploaded${videoChanged ? ' video' : ''}${posterChanged ? ' poster' : ''}`);
  }

  writeManifest(manifest);
  console.log('-'.repeat(48));
  console.log(`Uploaded ${uploaded}, skipped ${skipped}. Manifest: ${path.relative(process.cwd(), MANIFEST_PATH)}`);
}

// Cloudinary echoes values back in some errors (e.g. "Invalid cloud_name <name>"): never print them.
function redact(message: string): string {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  return [cloudName, apiKey, apiSecret]
    .filter((value) => value.length > 0)
    .reduce((text, value) => text.split(value).join('[redacted]'), message);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : JSON.stringify(error);
  console.error(`media:upload failed: ${redact(message)}`);
  process.exit(1);
});
