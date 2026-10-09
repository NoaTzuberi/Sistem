import type { WorkoutLog as PublicWorkoutLog, WorkoutSummaryPayload } from '@sistem/types';
import { evaluateAchievementsSafely } from '../achievements/achievement.service';
import { PUMP_PHOTO_FOLDER } from '../privatePhotos/privatePhoto.constants';
import { deletePrivatePhoto, uploadPrivatePhoto } from '../privatePhotos/privatePhoto.service';
import { isAcceptedImage } from '../privatePhotos/privatePhoto.validation';
import { WorkoutLog } from './workoutLog.model';
import { WorkoutLogNotFoundError, getWorkoutLogForTrainee } from './workoutLog.service';
import type { WorkoutLogDocument } from './workoutLog.types';
import { LocalizedError } from '../../i18n';

// The workout summary (PRD §5.3): "How was it?" rating, notes and the Daily Pump photo.
// Only on her own completed workouts; she can change them any time (owner decision).

export class WorkoutLogNotCompletedError extends LocalizedError {}
export class InvalidPhotoError extends LocalizedError {}

/** Her own completed log, or the matching error. */
async function assertCompleted(logId: string, traineeId: string): Promise<void> {
  const log = await WorkoutLog.findOne({ _id: logId, traineeId }).select('status').lean<Pick<WorkoutLogDocument, 'status'>>();
  if (!log) throw new WorkoutLogNotFoundError('workout_log_not_found');
  if (log.status !== 'completed') {
    throw new WorkoutLogNotCompletedError('workout_summary_not_finished');
  }
}

export async function updateWorkoutSummary(
  logId: string,
  traineeId: string,
  payload: WorkoutSummaryPayload,
): Promise<PublicWorkoutLog> {
  await assertCompleted(logId, traineeId);
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, ''> = {};
  if (payload.rating === null) $unset.rating = '';
  else if (payload.rating !== undefined) $set.rating = payload.rating;
  if (payload.notes === null) $unset.notes = '';
  else if (payload.notes !== undefined) $set.notes = payload.notes;

  if (Object.keys($set).length > 0 || Object.keys($unset).length > 0) {
    await WorkoutLog.updateOne(
      { _id: logId, traineeId, status: 'completed' },
      { ...(Object.keys($set).length > 0 && { $set }), ...(Object.keys($unset).length > 0 && { $unset }) },
      { runValidators: true },
    );
  }
  return getWorkoutLogForTrainee(logId, traineeId);
}

/** A replaced or removed photo is deleted from storage. A failure there is logged, not shown to her. */
async function deleteQuietly(publicId: string): Promise<void> {
  try {
    await deletePrivatePhoto(publicId);
  } catch (error) {
    console.error(`[privatePhotos] could not delete ${publicId}`, error);
  }
}

/** Uploads (or replaces) the Daily Pump photo of her finished workout. */
export async function setPumpPhoto(
  logId: string,
  traineeId: string,
  data: Buffer,
  now: Date = new Date(),
): Promise<PublicWorkoutLog> {
  await assertCompleted(logId, traineeId);
  if (!isAcceptedImage(data)) throw new InvalidPhotoError('photo_invalid_image');

  const publicId = await uploadPrivatePhoto(data, `${PUMP_PHOTO_FOLDER}/${traineeId}`, logId);
  // Returns the log as it was, so a concurrent upload deletes exactly the photo it replaced.
  const previous = await WorkoutLog.findOneAndUpdate(
    { _id: logId, traineeId, status: 'completed' },
    { $set: { pumpPhoto: { publicId, uploadedAt: now } } },
    { returnDocument: 'before' },
  ).lean<Pick<WorkoutLogDocument, 'pumpPhoto'>>();
  if (!previous) {
    await deleteQuietly(publicId);
    throw new WorkoutLogNotFoundError('workout_log_not_found');
  }
  if (previous.pumpPhoto) await deleteQuietly(previous.pumpPhoto.publicId);
  // first_pump_photo: unlocked by this log, so the summary shows it with the photo.
  await evaluateAchievementsSafely(traineeId, now);
  return getWorkoutLogForTrainee(logId, traineeId);
}

export async function removePumpPhoto(logId: string, traineeId: string): Promise<PublicWorkoutLog> {
  await assertCompleted(logId, traineeId);
  const previous = await WorkoutLog.findOneAndUpdate(
    { _id: logId, traineeId, status: 'completed' },
    { $unset: { pumpPhoto: '' } },
    { returnDocument: 'before' },
  ).lean<Pick<WorkoutLogDocument, 'pumpPhoto'>>();
  if (previous?.pumpPhoto) await deleteQuietly(previous.pumpPhoto.publicId);
  return getWorkoutLogForTrainee(logId, traineeId);
}
