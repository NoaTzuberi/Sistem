// Shape of apps/mobile/src/features/onboarding/data/onboardingMedia.json.
// Public delivery URLs only — never credentials.
export interface OnboardingMediaEntry {
  video: string;
  poster: string;
  // MD5 of the uploaded local files, so a re-run can skip unchanged media.
  videoMd5: string;
  posterMd5: string;
}

export type OnboardingMediaManifest = Record<string, OnboardingMediaEntry>;
