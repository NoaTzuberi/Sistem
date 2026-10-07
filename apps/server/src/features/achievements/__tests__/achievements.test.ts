import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../exercises/__tests__/testDb';
import { startApiTestClient, createTestUser } from '../../../testing/apiTestClient';
import type { ApiTestClient } from '../../../testing/apiTestClient';
import { Exercise } from '../../exercises/exercise.model';
import { Plan } from '../../plans/plan.model';
import { addDays, currentWeekStart } from '../../plans/planWeek';
import { WorkoutLog } from '../../workoutLogs/workoutLog.model';
import { Achievement } from '../achievement.model';
import { evaluateAchievements } from '../achievement.service';

// Phase 11 (PRD §7): achievements are evaluated after each finish, Daily Pump upload and
// body save; idempotent; shown on the log, celebrated once (seen), read by her coach.

const storage = vi.hoisted(() => {
  let count = 0;
  return {
    upload: vi.fn(async (_data: Buffer, folder: string, name: string) => `${folder}/${name}-${++count}`),
    remove: vi.fn(async (_publicId: string) => undefined),
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
const DAY_MS = 86_400_000;

let api: ApiTestClient;
let coach: TestUser;
let otherCoach: TestUser;
let trainee: TestUser;
let squatId: string;

async function createPlan(weekStartDate = currentWeekStart(TIMEZONE), workouts = 2) {
  return Plan.create({
    traineeId: trainee.user._id,
    coachId: coach.user._id,
    weekStartDate,
    status: 'published',
    publishedAt: new Date(),
    workouts: Array.from({ length: workouts }, (_, index) => ({
      title: `Day ${index + 1}`,
      order: index,
      exercises: [{ exerciseId: squatId, sets: 1, reps: 8 }],
    })),
  });
}

type CreatedPlan = Awaited<ReturnType<typeof createPlan>>;

/** Starts workout `index` of the plan and finishes it with its one set done. */
async function finishWorkout(plan: CreatedPlan, index: number) {
  const workout = plan.workouts[index];
  const started = await api.request('POST', '/workout-logs', {
    token: trainee.token,
    body: { planId: String(plan._id), workoutId: String(workout._id) },
  });
  const logId = started.body.session.log.id as string;
  const sets = [{ planExerciseId: String(workout.exercises[0]._id), setIndex: 0, reps: 8, weight: 50, completed: true }];
  const finished = await api.request('POST', `/workout-logs/${logId}/finish`, { token: trainee.token, body: { sets } });
  expect(finished.status).toBe(200);
  return { logId, log: finished.body.log };
}

/** A completed log written straight to the database (history before Phase 11). */
async function pastLog(plan: CreatedPlan, index: number, finishedAt: Date, totalVolume = 0) {
  return WorkoutLog.create({
    traineeId: trainee.user._id,
    planId: plan._id,
    workoutId: plan.workouts[index]._id,
    workoutTitle: `Day ${index + 1}`,
    status: 'completed',
    startedAt: finishedAt,
    finishedAt,
    stats: { durationSec: 600, totalVolume, setsCompleted: 1, prCount: 0 },
    sets: [{ exerciseId: squatId, setIndex: 0, type: 'working', reps: 8, weight: 50, completed: true }],
  });
}

function types(achievements: { type: string }[]): string[] {
  return achievements.map((achievement) => achievement.type).sort();
}

describe('achievements', () => {
  beforeAll(async () => {
    await connectTestDatabase();
    api = await startApiTestClient();
    await Achievement.init();
  });

  afterAll(async () => {
    await api.close();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    await Achievement.init();
    coach = await createTestUser('coach@example.com', { role: 'coach' });
    otherCoach = await createTestUser('coach2@example.com', { role: 'coach' });
    trainee = await createTestUser('t@example.com', { coachId: coach.user._id, timezone: TIMEZONE });
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('after a workout finish', () => {
    it('the first workout unlocks first_workout, on that log, not seen yet', async () => {
      const plan = await createPlan();
      const { logId, log } = await finishWorkout(plan, 0);
      expect(log.achievements).toHaveLength(1);
      expect(log.achievements[0]).toMatchObject({ type: 'first_workout', sourceLogId: logId, seen: false, value: 1 });

      // The same on her log page later.
      const page = await api.request('GET', `/workout-logs/${logId}`, { token: trainee.token });
      expect(types(page.body.log.achievements)).toEqual(['first_workout']);
    });

    it('finishing the whole week unlocks perfect_week, and the streak counts it', async () => {
      const plan = await createPlan();
      await finishWorkout(plan, 0);
      const midWeek = await api.request('GET', '/achievements', { token: trainee.token });
      expect(midWeek.body.streak).toEqual({ current: 0, best: 0, thisWeek: { done: 1, planned: 2 }, weekCompletionRatio: 1 });

      const { log } = await finishWorkout(plan, 1);
      expect(types(log.achievements)).toEqual(['perfect_week']);
      const done = await api.request('GET', '/achievements', { token: trainee.token });
      expect(done.body.streak).toMatchObject({ current: 1, best: 1, thisWeek: { done: 2, planned: 2 } });
      expect(done.body.stats).toEqual({ completedWorkouts: 2, totalVolume: 800, personalRecords: 0 });
      expect(types(done.body.unlocked)).toEqual(['first_workout', 'perfect_week']);
      expect(done.body.progress.find((entry: { type: string }) => entry.type === 'workouts_5')).toMatchObject({
        current: 2,
        threshold: 5,
        count: 0,
      });
    });

    it('a discarded workout never counts', async () => {
      const plan = await createPlan();
      const started = await api.request('POST', '/workout-logs', {
        token: trainee.token,
        body: { planId: String(plan._id), workoutId: String(plan.workouts[0]._id) },
      });
      await api.request('POST', `/workout-logs/${started.body.session.log.id}/abandon`, { token: trainee.token });
      await evaluateAchievements(trainee.id);
      expect(await Achievement.countDocuments()).toBe(0);
    });

    it('a comeback after 14+ days', async () => {
      const plan = await createPlan();
      const earlier = await createPlan(addDays(currentWeekStart(TIMEZONE), -28), 1);
      await pastLog(earlier, 0, new Date(Date.now() - 20 * DAY_MS));
      const { logId, log } = await finishWorkout(plan, 0);
      expect(log.achievements.map((achievement: { type: string }) => achievement.type)).toContain('comeback');
      expect(await Achievement.exists({ key: `comeback:${logId}` })).toBeTruthy();
    });

    it('a failing evaluation never fails the finish; the next one catches up', async () => {
      const plan = await createPlan();
      vi.spyOn(Achievement, 'create').mockRejectedValueOnce(new Error('database down'));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const first = await finishWorkout(plan, 0);
      expect(first.log.achievements).toEqual([]);

      await finishWorkout(plan, 1);
      const stored = await Achievement.find().lean();
      expect(stored.map((achievement) => achievement.type).sort()).toEqual(['first_workout', 'perfect_week']);
      // first_workout still points to the log that earned it.
      expect(String(stored.find((achievement) => achievement.type === 'first_workout')?.sourceLogId)).toBe(first.logId);
    });
  });

  it('idempotent: evaluating again awards nothing twice', async () => {
    const plan = await createPlan();
    await finishWorkout(plan, 0);
    expect(await evaluateAchievements(trainee.id)).toEqual([]);
    await Promise.all([evaluateAchievements(trainee.id), evaluateAchievements(trainee.id)]);
    expect(await Achievement.countDocuments({ traineeId: trainee.user._id })).toBe(1);
  });

  it('the first Daily Pump photo is unlocked by that log', async () => {
    const plan = await createPlan();
    const { logId } = await finishWorkout(plan, 0);
    const res = await api.request('PUT', `/workout-logs/${logId}/pump-photo`, {
      token: trainee.token,
      raw: { data: JPEG, contentType: 'image/jpeg' },
    });
    expect(res.status).toBe(200);
    expect(types(res.body.log.achievements)).toEqual(['first_pump_photo', 'first_workout']);
  });

  describe('after a body save', () => {
    it('measurements unlock first_measurement, once', async () => {
      const first = await api.request('PUT', '/body-metrics/2026-10-01', {
        token: trainee.token,
        body: { measurements: { waist: 70 } },
      });
      expect(first.status).toBe(200);
      expect(types(first.body.achievementsUnlocked)).toEqual(['first_measurement']);
      expect(first.body.achievementsUnlocked[0].sourceBodyMetricId).toBe(first.body.metric.id);

      const second = await api.request('PUT', '/body-metrics/2026-10-02', { token: trainee.token, body: { measurements: { waist: 69 } } });
      expect(second.body.achievementsUnlocked).toEqual([]);
    });

    it('a weight alone unlocks nothing', async () => {
      const res = await api.request('PUT', '/body-metrics/2026-10-01', { token: trainee.token, body: { weight: 60 } });
      expect(res.body.achievementsUnlocked).toEqual([]);
    });

    it('the first progress photo', async () => {
      const res = await api.request('PUT', '/body-metrics/2026-10-01/photos/front', {
        token: trainee.token,
        raw: { data: JPEG, contentType: 'image/jpeg' },
      });
      expect(res.status).toBe(200);
      expect(types(res.body.achievementsUnlocked)).toEqual(['first_progress_photo']);
    });
  });

  describe('seen', () => {
    it('marks her celebration as shown', async () => {
      const plan = await createPlan();
      const { log } = await finishWorkout(plan, 0);
      const res = await api.request('POST', '/achievements/seen', { token: trainee.token, body: { ids: [log.achievements[0].id] } });
      expect(res.status).toBe(204);
      const overview = await api.request('GET', '/achievements', { token: trainee.token });
      expect(overview.body.unlocked[0].seen).toBe(true);
    });

    it.each([{}, { ids: [] }, { ids: ['nope'] }, { ids: 'x' }])('bad body %j is 400', async (body) => {
      const res = await api.request('POST', '/achievements/seen', { token: trainee.token, body });
      expect(res.status).toBe(400);
    });

    it('a coach cannot use the trainee routes', async () => {
      expect((await api.request('GET', '/achievements', { token: coach.token })).status).toBe(403);
    });
  });

  describe('the coach', () => {
    it('reads her trainee’s overview without marking anything seen', async () => {
      const plan = await createPlan();
      await finishWorkout(plan, 0);
      const res = await api.request('GET', `/coach/trainees/${trainee.id}/achievements`, { token: coach.token });
      expect(res.status).toBe(200);
      expect(types(res.body.unlocked)).toEqual(['first_workout']);
      expect(res.body.streak.thisWeek).toEqual({ done: 1, planned: 2 });
      expect((await Achievement.findOne().lean())?.seenAt).toBeNull();
    });

    it('another coach gets 404', async () => {
      const res = await api.request('GET', `/coach/trainees/${trainee.id}/achievements`, { token: otherCoach.token });
      expect(res.status).toBe(404);
    });
  });

  describe('backfill', () => {
    it('dates each unlock to when its rule was met, marks it seen, and runs again safely', async () => {
      const lastWeek = await createPlan(addDays(currentWeekStart(TIMEZONE), -7), 2);
      const firstAt = new Date(Date.now() - 6 * DAY_MS);
      const secondAt = new Date(Date.now() - 5 * DAY_MS);
      const first = await pastLog(lastWeek, 0, firstAt, 6_000);
      const second = await pastLog(lastWeek, 1, secondAt, 6_000);

      const created = await evaluateAchievements(trainee.id, { backfill: true });
      expect(types(created)).toEqual(['first_workout', 'perfect_week', 'volume_10k']);
      const stored = await Achievement.find().lean();
      const byType = new Map(stored.map((achievement) => [achievement.type, achievement]));
      expect(byType.get('first_workout')?.unlockedAt).toEqual(firstAt);
      expect(String(byType.get('first_workout')?.sourceLogId)).toBe(String(first._id));
      expect(byType.get('volume_10k')?.unlockedAt).toEqual(secondAt);
      expect(byType.get('perfect_week')?.key).toBe(`perfect_week:${lastWeek.weekStartDate}`);
      expect(String(byType.get('perfect_week')?.sourceLogId)).toBe(String(second._id));
      expect(stored.every((achievement) => achievement.seenAt instanceof Date)).toBe(true);

      expect(await evaluateAchievements(trainee.id, { backfill: true })).toEqual([]);
      expect(await Achievement.countDocuments()).toBe(3);
    });
  });
});
