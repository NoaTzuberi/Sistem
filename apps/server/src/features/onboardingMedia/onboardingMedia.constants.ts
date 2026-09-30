import path from 'node:path';

// Resolved from the server workspace root (npm scripts run with cwd = apps/server).
export const SOURCE_VIDEO_DIR = path.resolve('../mobile/src/assets/onBoardingvid');
export const OUTPUT_DIR = path.resolve('data/onboarding-media');
export const OUTPUT_VIDEO_DIR = path.join(OUTPUT_DIR, 'videos');
export const OUTPUT_POSTER_DIR = path.join(OUTPUT_DIR, 'posters');

export const MANIFEST_PATH = path.resolve('../mobile/src/features/onboarding/data/onboardingMedia.json');

export const CLOUDINARY_VIDEO_FOLDER = 'sistem/onboarding/videos';
export const CLOUDINARY_POSTER_FOLDER = 'sistem/onboarding/posters';

// Mobile-friendly target: short side <= 720 (never upscaled), <= 30 fps.
export const MAX_SHORT_SIDE = 720;
export const MAX_FPS = 30;
export const CRF = 26;
export const MAX_BITRATE = '2M';
export const BUFFER_SIZE = '4M';

/**
 * Onboarding activity id (apps/mobile features/onboarding/data/activities.ts) ->
 * original stock clip in SOURCE_VIDEO_DIR. 'other_activity' intentionally has none.
 */
export const ONBOARDING_VIDEO_SOURCES: Record<string, string> = {
  gym_strength_training: 'gym.mp4',
  calisthenics: '10477144-uhd_4096_2160_25fps.mp4',
  functional_training: 'Functional.mp4',
  crossfit: 'crossfit.mp4',
  running: 'running.mp4',
  cycling: 'Cycling.mp4',
  swimming: 'swimming.mp4',
  rowing: 'Rowing.mp4',
  hiking: 'hiking.mp4',
  jump_rope: 'jump rope.mp4',
  yoga: 'Yoga.mp4',
  pilates: 'Pilates.mp4',
  mobility: 'Mobility.mp4',
  dance: 'Dance.mp4',
  boxing: 'Boxing.mp4',
  martial_arts: 'Martial Arts.mp4',
  brazilian_jiu_jitsu: 'Jiu-Jitsu.mp4',
  muay_thai: '5752167-uhd_3840_2160_25fps.mp4',
  surfing: 'Surfing.mp4',
  skateboarding: 'skateboarding.mp4',
  climbing: 'Climbing.mp4',
  skiing: 'Skiing.mp4',
  snowboarding: 'Snowboarding.mp4',
  football_soccer: 'football.mp4',
  basketball: 'basketball.mp4',
  tennis: 'Tennis.mp4',
  volleyball: 'volyball.mp4',
  table_tennis: 'Table Tennis.mp4',
  badminton: 'Badminton.mp4',
  rugby: 'Rugby.mp4',
};
