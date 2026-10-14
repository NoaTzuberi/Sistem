import type { Types } from 'mongoose';
import type {
  BodyMetric as PublicBodyMetric,
  BodyMetricList,
  ProgressPhotoPose,
  StartingPhoto as PublicStartingPhoto,
  SaveBodyMetricPayload,
} from '@sistem/types';
import { localDateString } from '../plans/planWeek';
import { User } from '../users/user.model';
import { roundStoredValue } from '../users/units';
import { PROGRESS_PHOTO_FOLDER } from '../privatePhotos/privatePhoto.constants';
import { deletePrivatePhoto, toPublicPhoto, uploadPrivatePhoto } from '../privatePhotos/privatePhoto.service';
import { isAcceptedImage } from '../privatePhotos/privatePhoto.validation';
import { BodyMetric } from './bodyMetric.model';
import { BODY_MEASUREMENT_IDS, PROGRESS_PHOTO_POSE_IDS } from './bodyMetric.constants';
import type { BodyMetricDocument, ProgressPhotoFields } from './bodyMetric.types';
import { LocalizedError } from '../../i18n';

// Body tracking (PRD §5.5): one BodyMetric per trainee per day holds that day's weight,
// measurements and progress photos. Values are kg / cm. Every write is scoped to the
// signed-in trainee; the coach only reads (loadCoachTrainee). A day left with nothing
// in it is deleted, so lists and charts never show empty days.

export class BodyMetricDateError extends LocalizedError {}
export class InvalidProgressPhotoError extends LocalizedError {}

type LeanBodyMetric = Omit<BodyMetricDocument, 'measurements'> & {
  _id: Types.ObjectId;
  // .lean() returns a Map field as a plain object.
  measurements?: Record<string, number>;
};

const DUPLICATE_KEY = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return (error as { code?: number }).code === DUPLICATE_KEY;
}

function poseOrder(pose: ProgressPhotoPose): number {
  return PROGRESS_PHOTO_POSE_IDS.indexOf(pose);
}

/** Signed photo links are made here, per request, after the caller's access check. */
export function toPublicBodyMetric(metric: LeanBodyMetric): PublicBodyMetric {
  return {
    id: String(metric._id),
    traineeId: String(metric.traineeId),
    date: metric.date,
    weight: metric.weight,
    measurements: metric.measurements ?? {},
    photos: [...metric.photos]
      .sort((a, b) => poseOrder(a.pose) - poseOrder(b.pose))
      .map((photo) => ({ pose: photo.pose, ...toPublicPhoto(photo) })),
    ...(metric.startingPhoto && {
      startingPhoto: { tag: 'starting', ...toPublicPhoto(metric.startingPhoto) } satisfies PublicStartingPhoto,
    }),
    notes: metric.notes,
  };
}

/** Her days, newest first, with the measurement list the screens offer. */
export async function listBodyMetricsForTrainee(traineeId: string): Promise<BodyMetricList> {
  const metrics = await BodyMetric.find({ traineeId }).sort({ date: -1 }).lean<LeanBodyMetric[]>();
  return { items: metrics.map(toPublicBodyMetric), measurementIds: [...BODY_MEASUREMENT_IDS] };
}

/** No day after today in her own time zone. */
async function assertNotInFuture(traineeId: string, date: string, now: Date): Promise<void> {
  const user = await User.findById(traineeId).select('timezone').lean();
  const today = localDateString(now, user?.timezone ?? 'UTC');
  if (date > today) throw new BodyMetricDateError('body_date_in_future');
}

function isEmptyDay(metric: LeanBodyMetric): boolean {
  return (
    metric.weight === undefined &&
    Object.keys(metric.measurements ?? {}).length === 0 &&
    metric.photos.length === 0 &&
    !metric.startingPhoto &&
    !metric.notes
  );
}

/** The day as it is now — deleted (null) when nothing is left in it. */
async function currentDay(traineeId: string, date: string): Promise<PublicBodyMetric | null> {
  const metric = await BodyMetric.findOne({ traineeId, date }).lean<LeanBodyMetric>();
  if (!metric) return null;
  if (!isEmptyDay(metric)) return toPublicBodyMetric(metric);
  // Conditional, so a value saved in the meantime is never deleted with it.
  await BodyMetric.deleteOne({
    _id: metric._id,
    weight: { $exists: false },
    photos: { $size: 0 },
    startingPhoto: { $exists: false },
    notes: { $in: [null, ''] },
    $or: [{ measurements: { $exists: false } }, { measurements: {} }],
  });
  const left = await BodyMetric.findById(metric._id).lean<LeanBodyMetric>();
  return left ? toPublicBodyMetric(left) : null;
}

/** Sets / clears her weight and measurements for one day (created on first save). */
export async function saveBodyMetric(
  traineeId: string,
  date: string,
  payload: SaveBodyMetricPayload,
  now: Date = new Date(),
): Promise<PublicBodyMetric | null> {
  await assertNotInFuture(traineeId, date, now);

  const $set: Record<string, number> = {};
  const $unset: Record<string, ''> = {};
  if (payload.weight === null) $unset.weight = '';
  else if (payload.weight !== undefined) $set.weight = roundStoredValue(payload.weight);
  for (const [id, value] of Object.entries(payload.measurements ?? {})) {
    if (value === null) $unset[`measurements.${id}`] = '';
    else $set[`measurements.${id}`] = roundStoredValue(value);
  }

  if (Object.keys($set).length > 0) {
    const update = { $set, ...(Object.keys($unset).length > 0 && { $unset }) };
    try {
      await BodyMetric.updateOne({ traineeId, date }, update, { upsert: true, runValidators: true });
    } catch (error) {
      // Two first saves of the same day at once: the other one created it — update it.
      if (!isDuplicateKeyError(error)) throw error;
      await BodyMetric.updateOne({ traineeId, date }, update, { runValidators: true });
    }
  } else {
    // Only clearing: never create a day for it.
    await BodyMetric.updateOne({ traineeId, date }, { $unset });
  }
  return currentDay(traineeId, date);
}

/** Deletes a whole day, its photos included. */
export async function deleteBodyMetricDay(traineeId: string, date: string): Promise<void> {
  const deleted = await BodyMetric.findOneAndDelete({ traineeId, date }).lean<LeanBodyMetric>();
  for (const photo of deleted?.photos ?? []) await deleteQuietly(photo.publicId);
  if (deleted?.startingPhoto) await deleteQuietly(deleted.startingPhoto.publicId);
}

/** A replaced or removed photo is deleted from storage. A failure there is logged, not shown to her. */
async function deleteQuietly(publicId: string): Promise<void> {
  try {
    await deletePrivatePhoto(publicId);
  } catch (error) {
    console.error(`[privatePhotos] could not delete ${publicId}`, error);
  }
}

/** Puts the photo in the day's slot for its pose; returns the photo it replaced, if any. */
async function placePhoto(traineeId: string, date: string, photo: ProgressPhotoFields): Promise<ProgressPhotoFields | null> {
  try {
    await BodyMetric.updateOne({ traineeId, date }, { $setOnInsert: { photos: [] } }, { upsert: true });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }
  // Two tries: a concurrent upload of the same pose can take the empty slot in between.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const replaced = await BodyMetric.findOneAndUpdate(
      { traineeId, date, 'photos.pose': photo.pose },
      { $set: { 'photos.$': photo } },
      { returnDocument: 'before' },
    ).lean<LeanBodyMetric>();
    if (replaced) return replaced.photos.find((old) => old.pose === photo.pose) ?? null;

    const added = await BodyMetric.updateOne(
      { traineeId, date, 'photos.pose': { $ne: photo.pose } },
      { $push: { photos: photo } },
    );
    if (added.modifiedCount > 0) return null;
  }
  throw new Error('Could not save the progress photo.');
}

/** Uploads (or replaces) the photo of one pose on one day. */
export async function setProgressPhoto(
  traineeId: string,
  date: string,
  pose: ProgressPhotoPose,
  data: Buffer,
  now: Date = new Date(),
): Promise<PublicBodyMetric | null> {
  await assertNotInFuture(traineeId, date, now);
  if (!isAcceptedImage(data)) throw new InvalidProgressPhotoError('photo_invalid_image');

  const publicId = await uploadPrivatePhoto(data, `${PROGRESS_PHOTO_FOLDER}/${traineeId}`, `${date}-${pose}`);
  let replaced: ProgressPhotoFields | null;
  try {
    replaced = await placePhoto(traineeId, date, { publicId, pose, uploadedAt: now });
  } catch (error) {
    await deleteQuietly(publicId);
    throw error;
  }
  if (replaced) await deleteQuietly(replaced.publicId);
  return currentDay(traineeId, date);
}

/** Replaces the trainee's single dated baseline photo, in the same private photo store. */
export async function setStartingPhoto(
  traineeId: string,
  date: string,
  data: Buffer,
  now: Date = new Date(),
): Promise<PublicBodyMetric | null> {
  await assertNotInFuture(traineeId, date, now);
  if (!isAcceptedImage(data)) throw new InvalidProgressPhotoError('photo_invalid_image');

  const publicId = await uploadPrivatePhoto(data, `${PROGRESS_PHOTO_FOLDER}/${traineeId}`, `${date}-starting`);
  let previous: LeanBodyMetric | null = null;
  try {
    previous = await BodyMetric.findOneAndUpdate(
      { traineeId, startingPhoto: { $exists: true } },
      { $unset: { startingPhoto: '' } },
      { returnDocument: 'before' },
    ).lean<LeanBodyMetric>();
    await BodyMetric.updateOne(
      { traineeId, date },
      { $set: { startingPhoto: { publicId, tag: 'starting', uploadedAt: now } } },
      { upsert: true, runValidators: true },
    );
  } catch (error) {
    await deleteQuietly(publicId);
    if (previous?.startingPhoto) {
      await BodyMetric.updateOne(
        { traineeId, date: previous.date },
        { $set: { startingPhoto: previous.startingPhoto } },
        { upsert: true },
      ).catch((restoreError) => console.error('[privatePhotos] could not restore starting photo', restoreError));
    }
    throw error;
  }

  if (previous?.startingPhoto) {
    await deleteQuietly(previous.startingPhoto.publicId);
    if (previous.date !== date) await currentDay(traineeId, previous.date);
  }
  return currentDay(traineeId, date);
}

export async function removeProgressPhoto(
  traineeId: string,
  date: string,
  pose: ProgressPhotoPose,
): Promise<PublicBodyMetric | null> {
  const previous = await BodyMetric.findOneAndUpdate(
    { traineeId, date },
    { $pull: { photos: { pose } } },
    { returnDocument: 'before' },
  ).lean<LeanBodyMetric>();
  const removed = previous?.photos.find((photo) => photo.pose === pose);
  if (removed) await deleteQuietly(removed.publicId);
  return currentDay(traineeId, date);
}

/**
 * The onboarding weight as her first weigh-in (owner decision, Phase 10) — called once,
 * on the first completion. A weight she already logged that day is kept.
 */
export async function recordOnboardingWeight(traineeId: string, date: string, weightKg: number): Promise<void> {
  try {
    await BodyMetric.updateOne(
      { traineeId, date, weight: { $exists: false } },
      { $set: { weight: roundStoredValue(weightKg) } },
      { upsert: true },
    );
  } catch (error) {
    // The day exists with a weight already (the filter missed it, the upsert collided).
    if (!isDuplicateKeyError(error)) throw error;
  }
}
