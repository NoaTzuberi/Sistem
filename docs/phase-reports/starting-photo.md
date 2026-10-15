# Trainee starting photo

**Status:** implemented. The onboarding step, trainee Body screen, Home reminder, private upload path, and coach comparison default are connected to the existing progress-photo system. No `.env` values or secrets were read or included. No git write commands were run.

## Behavior

- Onboarding now ends with the optional **תמונת התחלה** step after the questionnaire. It explains that the photo is private to the trainee and her coach, and offers camera/upload or skip. Saving the photo completes onboarding; skipping records the step and completes onboarding.
- If the trainee has no starting photo, Home shows a dismissible reminder that links to Body photos. Dismissal is stored per account on that device. The Body photos screen always has a starting-photo upload/change entry.
- On mobile the file picker accepts `image/*` and requests the rear camera when supported. The existing photo compressor limits the source to 15 MiB, resizes the long edge to 1600 px, encodes JPEG at 0.82 quality, and drops metadata (including EXIF location). The UI reports preparation/upload progress and gives clear size, read, network, and upload errors.
- The dashboard compare view uses the starting photo and its date as the default “before” when a later pose photo exists. The starting image remains visible as the baseline if there is not yet a later comparison image.
- Photo links are signed, expiring private-download URLs. Storage IDs remain server-side. Trainee uploads require authentication and the trainee role; coach reads pass through the existing assigned-trainee access check before the server generates signed links.

## Storage and model

The existing `BodyMetric` document and authenticated private-photo storage are reused. The optional `startingPhoto` subdocument stores a private storage ID, the fixed `starting` tag, and `uploadedAt`; the date is the containing BodyMetric's existing date. A partial unique index permits one starting photo per trainee. Replacing a starting photo removes the prior private asset; deleting its BodyMetric day removes that asset too. Existing front/side/back progress photos are unchanged.

This is additive and does not require a migration for existing records: documents without `startingPhoto` remain valid. Existing signed-photo serialization adds a signed URL only after the requesting trainee or assigned coach has passed the existing route checks.

## Main implementation files

- Shared contract and onboarding step IDs: `packages/types/src/index.ts`, `apps/server/src/features/onboarding/onboarding.constants.ts`.
- Existing BodyMetric/private-photo model and server flow: `apps/server/src/features/bodyMetrics/bodyMetric.model.ts`, `bodyMetric.types.ts`, `bodyMetric.service.ts`, `bodyMetric.controller.ts`, `bodyMetric.routes.ts`.
- Upload API and client-side compression/upload state: `packages/api-client/src/traineeApi.ts`, `apps/mobile/src/services/bodyMetrics/bodyMetricsService.ts`, `apps/mobile/src/features/bodyTracking/hooks/useStartingPhotoUpload.ts`.
- Onboarding and translations: `apps/mobile/src/features/onboarding/pages/OnboardingPage/OnboardingPage.tsx`, `apps/mobile/src/features/onboarding/steps/StartingPhotoStep/StartingPhotoStep.tsx`, `StartingPhotoStep.css`, `apps/mobile/src/features/onboarding/copy/he.ts`, `en.ts`, `apps/mobile/src/services/onboarding/onboardingService.ts`.
- Body screen, reminder, and translations: `apps/mobile/src/features/bodyTracking/components/StartingPhotoCard/StartingPhotoCard.tsx`, `StartingPhotoCard.css`, `apps/mobile/src/features/profile/pages/ProgressPhotosPage/ProgressPhotosPage.tsx`, `apps/mobile/src/features/home/components/StartingPhotoReminder/StartingPhotoReminder.tsx`, `StartingPhotoReminder.css`, `apps/mobile/src/features/home/hooks/useStartingPhotoReminder.ts`, `apps/mobile/src/features/home/pages/HomePage/HomePage.tsx`, and the Hebrew/English copy files under `bodyTracking/copy` and `home/copy`.
- Coach comparison and translations: `apps/dashboard/src/features/trainees/hooks/usePhotoCompare.ts`, `apps/dashboard/src/features/trainees/components/ProgressPhotosCard/ProgressPhotosCard.tsx`, `ProgressPhotosCard.css`, and `apps/dashboard/src/features/trainees/copy/he.ts`, `en.ts`.

## Build verification

- `npm run build -w @sistem/server` — passed.
- `npm run build -w @sistem/mobile` — passed. Vite reported the existing large-bundle advisory.
- `npm run build -w @sistem/dashboard` — TypeScript build is blocked by unresolved imports for `CalculationSummary`, `IntroEditor`, `MealEditor`, and `TipsEditor` in the nutrition editor, followed by implicit-any errors in that same editor. These files are outside this feature. The dashboard build could not verify the coach UI until those imports are resolved.
- Tests were not run.

## Suggested commit commands

Run these manually after reviewing the changes; they were not run as part of this task:

```sh
git add packages/types/src/index.ts packages/api-client/src/traineeApi.ts \
  apps/server/src/features/onboarding/onboarding.constants.ts \
  apps/server/src/features/bodyMetrics/bodyMetric.model.ts \
  apps/server/src/features/bodyMetrics/bodyMetric.types.ts \
  apps/server/src/features/bodyMetrics/bodyMetric.service.ts \
  apps/server/src/features/bodyMetrics/bodyMetric.controller.ts \
  apps/server/src/features/bodyMetrics/bodyMetric.routes.ts \
  apps/mobile/src/features apps/mobile/src/services/bodyMetrics/bodyMetricsService.ts \
  apps/mobile/src/services/onboarding/onboardingService.ts \
  apps/dashboard/src/features/trainees docs/phase-reports/starting-photo.md
git commit -m "Add private trainee starting photo"
```
