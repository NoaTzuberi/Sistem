import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../exercises/__tests__/testDb';
import { startApiTestClient, createTestUser } from '../../../testing/apiTestClient';
import type { ApiTestClient } from '../../../testing/apiTestClient';
import { Exercise } from '../../exercises/exercise.model';
import { PersonalRecord } from '../../personalRecords/personalRecord.model';
import { Plan } from '../../plans/plan.model';
import { currentWeekStart } from '../../plans/planWeek';
import { WorkoutLog } from '../workoutLog.model';

// Phase 9 (PRD §5.3): PRs at finish, the summary (rating + notes) and the Daily Pump
// photo — her own finished workouts only, visible to her coach and nobody else.
// Cloudinary is replaced by a fake: the real flow was checked against the owner's
// account by hand (phase report).

const storage = vi.hoisted(() => {
  let count = 0;
  return {
    upload: vi.fn(async (_data: Buffer, folder: string, name: string) => `${folder}/${name}-${++count}`),
    remove: vi.fn(async (_publicId: string) => undefined),
    reset() {
      count = 0;
      this.upload.mockClear();
      this.remove.mockClear();
    },
  };
});

vi.mock('../../privatePhotos/privatePhoto.service', () => ({
  PhotoStorageUnavailableError: class PhotoStorageUnavailableError extends Error {},
  uploadPrivatePhoto: storage.upload,
  deletePrivatePhoto: storage.remove,
  toPublicPhoto: (photo: { publicId: string; uploadedAt: Date }) => ({
    uploadedAt: photo.uploadedAt.toISOString(),
    url: `https://signed.test/${photo.publicId}`,
    urlExpiresAt: new Date(photo.uploadedAt.getTime() + 3600_000).toISOString(),
  }),
}));

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

const TIMEZONE = 'Asia/Jerusalem';
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

let api: ApiTestClient;
let coach: TestUser;
let otherCoach: TestUser;
let trainee: TestUser;
let other: TestUser;
let squatId: string;

async function createPlan(user: TestUser) {
  return Plan.create({
    traineeId: user.user._id,
    coachId: coach.user._id,
    weekStartDate: currentWeekStart(TIMEZONE),
    status: 'published',
    publishedAt: new Date(),
    workouts: [
      { title: 'Lower Body', order: 0, exercises: [{ exerciseId: squatId, sets: 2, reps: 8 }] },
      { title: 'Earlier', order: 1, exercises: [{ exerciseId: squatId, sets: 1, reps: 8 }] },
    ],
  });
}

type CreatedPlan = Awaited<ReturnType<typeof createPlan>>;

function squatSet(plan: CreatedPlan, setIndex: number, fields: Record<string, unknown>) {
  return { planExerciseId: String(plan.workouts[0].exercises[0]._id), setIndex, completed: true, ...fields };
}

/** Starts the first workout and finishes it with these set changes; returns the response. */
async function startAndFinish(plan: CreatedPlan, sets: Record<string, unknown>[], user = trainee) {
  const started = await api.request('POST', '/workout-logs', {
    token: user.token,
    body: { planId: String(plan._id), workoutId: String(plan.workouts[0]._id) },
  });
  const logId = started.body.session.log.id as string;
  const finished = await api.request('POST', `/workout-logs/${logId}/finish`, { token: user.token, body: { sets } });
  return { logId, finished };
}

/** A completed earlier workout: squat 8 × 40 kg (working) and a heavier warm-up. */
async function createEarlierLog(plan: CreatedPlan) {
  const finishedAt = new Date(Date.now() - 2 * 24 * 3600_000);
  await WorkoutLog.create({
    traineeId: trainee.user._id,
    planId: plan._id,
    workoutId: plan.workouts[1]._id,
    workoutTitle: 'Earlier',
    status: 'completed',
    startedAt: finishedAt,
    finishedAt,
    sets: [
      { exerciseId: squatId, setIndex: 0, type: 'working', reps: 8, weight: 40, completed: true },
      { exerciseId: squatId, setIndex: 1, type: 'warmup', reps: 3, weight: 50, completed: true },
    ],
  });
}

describe('workout summary & Daily Pump', () => {
  beforeAll(async () => {
    await connectTestDatabase();
    api = await startApiTestClient();
  });

  afterAll(async () => {
    await api.close();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    storage.reset();
    coach = await createTestUser('coach@example.com', { role: 'coach' });
    otherCoach = await createTestUser('coach2@example.com', { role: 'coach' });
    trainee = await createTestUser('t@example.com', { coachId: coach.user._id, timezone: TIMEZONE });
    other = await createTestUser('o@example.com', { coachId: coach.user._id, timezone: TIMEZONE });
    const squat = await Exercise.create({
      slug: 'squat',
      name: 'Squat',
      primaryMuscles: ['quadriceps'],
      equipment: ['barbell'],
      difficulty: 'beginner',
      movementType: 'strength',
      source: { provider: 'kaggle', dataset: 'test', importedAt: new Date() },
    });
    squatId = String(squat._id);
  });

  describe('PRs at finish', () => {
    it('the first workout on an exercise has no PRs', async () => {
      const plan = await createPlan(trainee);
      const { finished } = await startAndFinish(plan, [squatSet(plan, 0, { reps: 8, weight: 100 })]);
      expect(finished.body.log.stats.prCount).toBe(0);
      expect(finished.body.log.personalRecords).toEqual([]);
      expect(await PersonalRecord.countDocuments()).toBe(0);
    });

    it('records a heavier weight than any earlier working set, once', async () => {
      const plan = await createPlan(trainee);
      await createEarlierLog(plan);
      // 45 kg beats the working 40 (the 50 kg warm-up never counted).
      const { logId, finished } = await startAndFinish(plan, [
        squatSet(plan, 0, { reps: 8, weight: 45 }),
        squatSet(plan, 1, { reps: 10, weight: 40 }),
      ]);
      expect(finished.status).toBe(200);
      expect(finished.body.log.stats.prCount).toBe(1);
      expect(finished.body.log.personalRecords).toEqual([
        { exerciseId: squatId, type: 'weight', newValue: 45, previousValue: 40 },
      ]);

      const stored = await PersonalRecord.find().lean();
      expect(stored).toHaveLength(1);
      expect(String(stored[0].logId)).toBe(logId);

      // The same PR lines on her log page, in her list, and in the PR endpoint.
      const log = await api.request('GET', `/workout-logs/${logId}`, { token: trainee.token });
      expect(log.body.log.personalRecords).toHaveLength(1);
      const list = await api.request('GET', '/workout-logs', { token: trainee.token });
      expect(list.body.items.find((item: { id: string }) => item.id === logId).personalRecords).toHaveLength(1);
      const records = await api.request('GET', '/personal-records', { token: trainee.token });
      expect(records.body.items[0]).toMatchObject({ type: 'weight', newValue: 45, logId, exercise: { name: 'Squat' } });
    });

    it('never compares with another trainee or a discarded workout', async () => {
      const plan = await createPlan(trainee);
      const otherPlan = await createPlan(other);
      await startAndFinish(otherPlan, [squatSet(otherPlan, 0, { reps: 8, weight: 20 })], other);
      const discarded = await api.request('POST', '/workout-logs', {
        token: trainee.token,
        body: { planId: String(plan._id), workoutId: String(plan.workouts[1]._id) },
      });
      await api.request('PATCH', `/workout-logs/${discarded.body.session.log.id}/sets`, {
        token: trainee.token,
        body: { sets: [{ planExerciseId: String(plan.workouts[1].exercises[0]._id), setIndex: 0, reps: 8, weight: 10, completed: true }] },
      });
      await api.request('POST', `/workout-logs/${discarded.body.session.log.id}/abandon`, { token: trainee.token });

      const { finished } = await startAndFinish(plan, [squatSet(plan, 0, { reps: 8, weight: 30 })]);
      expect(finished.body.log.stats.prCount).toBe(0);
    });
  });

  describe('rating and notes', () => {
    it('saves, changes and clears them on her finished workout', async () => {
      const plan = await createPlan(trainee);
      const { logId } = await startAndFinish(plan, [squatSet(plan, 0, { reps: 8, weight: 40 })]);

      const saved = await api.request('PATCH', `/workout-logs/${logId}/summary`, {
        token: trainee.token,
        body: { rating: 4, notes: '  Felt strong  ' },
      });
      expect(saved.status).toBe(200);
      expect(saved.body.log).toMatchObject({ rating: 4, notes: 'Felt strong' });

      // Later, from the log page: change the rating only, then clear both.
      const changed = await api.request('PATCH', `/workout-logs/${logId}/summary`, { token: trainee.token, body: { rating: 5 } });
      expect(changed.body.log).toMatchObject({ rating: 5, notes: 'Felt strong' });
      const cleared = await api.request('PATCH', `/workout-logs/${logId}/summary`, {
        token: trainee.token,
        body: { rating: null, notes: '' },
      });
      expect(cleared.body.log.rating).toBeUndefined();
      expect(cleared.body.log.notes).toBeUndefined();
    });

    it('refuses bad values, an open workout and another trainee', async () => {
      const plan = await createPlan(trainee);
      const { logId } = await startAndFinish(plan, [squatSet(plan, 0, { reps: 8 })]);
      for (const body of [{ rating: 6 }, { rating: 2.5 }, { rating: '4' }, { notes: 'x'.repeat(1001) }, { notes: 3 }]) {
        expect((await api.request('PATCH', `/workout-logs/${logId}/summary`, { token: trainee.token, body })).status).toBe(400);
      }
      expect((await api.request('PATCH', `/workout-logs/${logId}/summary`, { token: other.token, body: { rating: 1 } })).status).toBe(404);

      const open = await api.request('POST', '/workout-logs', {
        token: trainee.token,
        body: { planId: String(plan._id), workoutId: String(plan.workouts[1]._id) },
      });
      const openId = open.body.session.log.id;
      expect((await api.request('PATCH', `/workout-logs/${openId}/summary`, { token: trainee.token, body: { rating: 3 } })).status).toBe(409);
    });
  });

  describe('Daily Pump photo', () => {
    async function finishedLogId() {
      const plan = await createPlan(trainee);
      return (await startAndFinish(plan, [squatSet(plan, 0, { reps: 8, weight: 40 })])).logId;
    }

    function upload(logId: string, user = trainee, raw = { data: JPEG, contentType: 'image/jpeg' }) {
      return api.request('PUT', `/workout-logs/${logId}/pump-photo`, { token: user.token, raw });
    }

    it('uploads into her private folder and returns only a signed link', async () => {
      const logId = await finishedLogId();
      const res = await upload(logId);
      expect(res.status).toBe(200);
      expect(storage.upload).toHaveBeenCalledWith(expect.any(Buffer), `sistem/pump-photos/${trainee.id}`, logId);
      expect(res.body.log.pumpPhoto).toEqual({
        uploadedAt: expect.any(String),
        url: `https://signed.test/sistem/pump-photos/${trainee.id}/${logId}-1`,
        urlExpiresAt: expect.any(String),
      });
      // The storage id is never part of the API.
      expect(JSON.stringify(res.body)).not.toContain('publicId');
    });

    it('replacing deletes the old photo; removing deletes the current one', async () => {
      const logId = await finishedLogId();
      await upload(logId);
      const replaced = await upload(logId);
      expect(replaced.body.log.pumpPhoto.url).toContain(`${logId}-2`);
      expect(storage.remove).toHaveBeenCalledWith(`sistem/pump-photos/${trainee.id}/${logId}-1`);

      const removed = await api.request('DELETE', `/workout-logs/${logId}/pump-photo`, { token: trainee.token });
      expect(removed.status).toBe(200);
      expect(removed.body.log.pumpPhoto).toBeNull();
      expect(storage.remove).toHaveBeenLastCalledWith(`sistem/pump-photos/${trainee.id}/${logId}-2`);
    });

    it('refuses what is not an image, the wrong type, a too-large file and an open workout', async () => {
      const logId = await finishedLogId();
      expect((await upload(logId, trainee, { data: Buffer.from('not an image'), contentType: 'image/jpeg' })).status).toBe(400);
      expect((await upload(logId, trainee, { data: JPEG, contentType: 'text/plain' })).status).toBe(415);
      const huge = Buffer.concat([JPEG, Buffer.alloc(3 * 1024 * 1024)]);
      expect((await upload(logId, trainee, { data: huge, contentType: 'image/jpeg' })).status).toBe(413);

      const plan = await Plan.findOne({ traineeId: trainee.user._id });
      const open = await api.request('POST', '/workout-logs', {
        token: trainee.token,
        body: { planId: String(plan!._id), workoutId: String(plan!.workouts[1]._id) },
      });
      expect((await upload(open.body.session.log.id)).status).toBe(409);
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it("another trainee can't upload, remove or see it", async () => {
      const logId = await finishedLogId();
      await upload(logId);
      storage.upload.mockClear();
      expect((await upload(logId, other)).status).toBe(404);
      expect((await api.request('DELETE', `/workout-logs/${logId}/pump-photo`, { token: other.token })).status).toBe(404);
      expect((await api.request('GET', `/workout-logs/${logId}`, { token: other.token })).status).toBe(404);
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('her coach sees the summary, PRs and photo link; another coach does not', async () => {
      const logId = await finishedLogId();
      await upload(logId);
      await api.request('PATCH', `/workout-logs/${logId}/summary`, { token: trainee.token, body: { rating: 3, notes: 'ok' } });

      const mine = await api.request('GET', `/coach/trainees/${trainee.id}/workout-logs`, { token: coach.token });
      expect(mine.status).toBe(200);
      expect(mine.body.items[0]).toMatchObject({
        id: logId,
        rating: 3,
        notes: 'ok',
        personalRecords: [],
        pumpPhoto: { url: expect.stringContaining('https://signed.test/') },
        exercises: [expect.objectContaining({ name: 'Squat' })],
      });

      expect((await api.request('GET', `/coach/trainees/${trainee.id}/workout-logs`, { token: otherCoach.token })).status).toBe(404);
      expect((await api.request('GET', `/coach/trainees/${trainee.id}/workout-logs`, { token: other.token })).status).toBe(403);
    });
  });
});
