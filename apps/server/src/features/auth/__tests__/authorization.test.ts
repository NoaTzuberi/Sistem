import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../exercises/__tests__/testDb';
import { startApiTestClient, createTestUser } from '../../../testing/apiTestClient';
import type { ApiTestClient } from '../../../testing/apiTestClient';
import { Plan } from '../../plans/plan.model';
import { WorkoutLog } from '../../workoutLogs/workoutLog.model';
import { BodyMetric } from '../../bodyMetrics/bodyMetric.model';
import { Achievement } from '../../achievements/achievement.model';
import { OnboardingResponse } from '../../onboarding/onboardingResponse.model';
import { config } from '../../../config/env';

// PRD §3: every route enforces roles server-side, and a trainee only ever reads her
// own data. A coach only sees trainees assigned to her (multi-coach ready).

let api: ApiTestClient;

async function createWorld() {
  const coachX = await createTestUser('coach-x@example.com', { role: 'coach' });
  const coachY = await createTestUser('coach-y@example.com', { role: 'coach' });
  const traineeA = await createTestUser('a@example.com', {
    coachId: coachX.user._id,
    onboardingStatus: 'completed',
    onboardingCompletedAt: new Date(),
  });
  const traineeB = await createTestUser('b@example.com', {
    coachId: coachX.user._id,
    onboardingStatus: 'completed',
    onboardingCompletedAt: new Date(),
  });
  const traineeC = await createTestUser('c@example.com', { coachId: coachY.user._id });

  const exerciseId = new Types.ObjectId();
  const workout = { title: 'Day 1', order: 0, exercises: [{ exerciseId, sets: 3, reps: 10 }] };
  const planB = await Plan.create({
    traineeId: traineeB.user._id,
    coachId: coachX.user._id,
    weekStartDate: '2026-10-04',
    status: 'published',
    publishedAt: new Date(),
    workouts: [workout],
  });
  const draftA = await Plan.create({
    traineeId: traineeA.user._id,
    coachId: coachX.user._id,
    weekStartDate: '2026-10-04',
    status: 'draft',
    workouts: [workout],
  });
  const logB = await WorkoutLog.create({
    traineeId: traineeB.user._id,
    planId: planB._id,
    workoutId: planB.workouts[0]._id,
    workoutTitle: 'Day 1',
    status: 'completed',
    sets: [{ exerciseId, setIndex: 0, type: 'working', reps: 10, weight: 20, completed: true }],
    pumpPhoto: { publicId: 'sistem/private/pump-b' },
  });
  await BodyMetric.create({ traineeId: traineeB.user._id, date: '2026-10-01', weight: 60, measurements: { waist: 70 } });
  await Achievement.create({ traineeId: traineeB.user._id, type: 'first_workout', key: 'first_workout' });
  await OnboardingResponse.create({ userId: traineeB.user._id, answers: { goals: ['build_muscle'] } });

  return { coachX, coachY, traineeA, traineeB, traineeC, planB, draftA, logB };
}

describe('authorization', () => {
  let world: Awaited<ReturnType<typeof createWorld>>;

  beforeAll(async () => {
    await connectTestDatabase();
    api = await startApiTestClient();
    // Signing photo links is local (no network); fixed values keep the test off .env.
    config.cloudinary = { cloudName: 'test-cloud', apiKey: 'test-key', apiSecret: 'test-secret' };
  });

  afterAll(async () => {
    await api.close();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    world = await createWorld();
  });

  describe('without a token', () => {
    it.each([
      '/plans',
      '/workout-logs',
      '/body-metrics',
      '/achievements',
      '/onboarding',
      '/coach/trainees',
    ])('GET %s is 401', async (path) => {
      expect((await api.request('GET', path)).status).toBe(401);
    });
  });

  describe('a trainee cannot read another trainee’s data', () => {
    it('another trainee’s plan is 404', async () => {
      const res = await api.request('GET', `/plans/${world.planB.id}`, { token: world.traineeA.token });
      expect(res.status).toBe(404);
    });

    it('her own published plan is readable, with resolved sets', async () => {
      const res = await api.request('GET', `/plans/${world.planB.id}`, { token: world.traineeB.token });
      expect(res.status).toBe(200);
      expect(res.body.plan.workouts[0].exercises[0].resolvedSets).toHaveLength(3);
    });

    it('her own draft plan is invisible (404, and not listed)', async () => {
      const single = await api.request('GET', `/plans/${world.draftA.id}`, { token: world.traineeA.token });
      expect(single.status).toBe(404);
      const list = await api.request('GET', '/plans', { token: world.traineeA.token });
      expect(list.body.items).toEqual([]);
    });

    it('another trainee’s workout log is 404', async () => {
      const res = await api.request('GET', `/workout-logs/${world.logB.id}`, { token: world.traineeA.token });
      expect(res.status).toBe(404);
    });

    it('her own workout log is readable; the photo comes only as an expiring signed link', async () => {
      const before = Date.now();
      const res = await api.request('GET', `/workout-logs/${world.logB.id}`, { token: world.traineeB.token });
      expect(res.status).toBe(200);
      const { pumpPhoto } = res.body.log;
      expect(Object.keys(pumpPhoto).sort()).toEqual(['uploadedAt', 'url', 'urlExpiresAt']);
      // An authenticated asset via the signed download API — never a public delivery URL.
      const url = new URL(pumpPhoto.url);
      expect(url.origin + url.pathname).toBe('https://api.cloudinary.com/v1_1/test-cloud/image/download');
      expect(url.searchParams.get('type')).toBe('authenticated');
      expect(url.searchParams.get('signature')).toBeTruthy();
      const expiresAt = Number(url.searchParams.get('expires_at')) * 1000;
      expect(expiresAt).toBe(new Date(pumpPhoto.urlExpiresAt).getTime());
      expect(Math.abs(expiresAt - before - 3600_000)).toBeLessThan(5_000);
      expect(JSON.stringify(res.body)).not.toContain('publicId');
    });

    it.each(['/plans', '/workout-logs', '/body-metrics', '/achievements'])('GET %s lists only her own items', async (path) => {
      const own = await api.request('GET', path, { token: world.traineeB.token });
      expect(own.body.items).toHaveLength(1);
      const other = await api.request('GET', path, { token: world.traineeA.token });
      expect(other.status).toBe(200);
      expect(other.body.items).toEqual([]);
    });

    it('onboarding answers are always the caller’s own', async () => {
      const res = await api.request('GET', '/onboarding', { token: world.traineeA.token });
      expect(res.status).toBe(200);
      expect(res.body.onboarding.answers).toBeNull();
    });

    it('an invalid id is 400, not a server error', async () => {
      const res = await api.request('GET', '/plans/not-an-id', { token: world.traineeA.token });
      expect(res.status).toBe(400);
    });
  });

  describe('a trainee cannot hit coach endpoints', () => {
    it.each([
      '/coach/trainees',
      '/coach/trainees/:self',
      '/coach/trainees/:self/plans',
      '/coach/trainees/:other/workout-logs',
      '/coach/trainees/:other/body-metrics',
    ])('GET %s is 403', async (template) => {
      const path = template.replace(':self', world.traineeA.id).replace(':other', world.traineeB.id);
      const res = await api.request('GET', path, { token: world.traineeA.token });
      expect(res.status).toBe(403);
    });
  });

  describe('a coach only sees her own trainees', () => {
    it('lists only trainees assigned to her', async () => {
      const res = await api.request('GET', '/coach/trainees', { token: world.coachX.token });
      expect(res.status).toBe(200);
      expect(res.body.items.map((t: { email: string }) => t.email).sort()).toEqual(['a@example.com', 'b@example.com']);
    });

    it('reads her trainee’s detail with the onboarding answers', async () => {
      const res = await api.request('GET', `/coach/trainees/${world.traineeB.id}`, { token: world.coachX.token });
      expect(res.status).toBe(200);
      expect(res.body.trainee.onboarding.answers.goals).toEqual(['build_muscle']);
    });

    it.each(['', '/plans', '/workout-logs', '/body-metrics'])(
      'another coach’s trainee is 404 on /coach/trainees/:id%s',
      async (suffix) => {
        const res = await api.request('GET', `/coach/trainees/${world.traineeC.id}${suffix}`, { token: world.coachX.token });
        expect(res.status).toBe(404);
      },
    );

    it('a coach id or a random id is 404 as well', async () => {
      for (const id of [world.coachY.id, String(new Types.ObjectId())]) {
        const res = await api.request('GET', `/coach/trainees/${id}`, { token: world.coachX.token });
        expect(res.status).toBe(404);
      }
    });

    it('sees drafts of her own trainees', async () => {
      const res = await api.request('GET', `/coach/trainees/${world.traineeA.id}/plans`, { token: world.coachX.token });
      expect(res.body.items.map((p: { status: string }) => p.status)).toEqual(['draft']);
    });

    it('cannot use trainee onboarding endpoints', async () => {
      const res = await api.request('PATCH', '/onboarding', {
        token: world.coachX.token,
        body: { step: 'goals', answers: { goals: ['build_muscle'] } },
      });
      expect(res.status).toBe(403);
    });
  });

  describe('app state follows the plan', () => {
    it('an onboarded trainee is waiting until a plan is published, then home', async () => {
      const before = await api.request('GET', '/auth/me', { token: world.traineeA.token });
      expect(before.body.user.appState).toBe('waiting');

      await Plan.updateOne({ _id: world.draftA._id }, { status: 'published', publishedAt: new Date() });

      const after = await api.request('GET', '/auth/me', { token: world.traineeA.token });
      expect(after.body.user.appState).toBe('home');
    });
  });
});
