import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../exercises/__tests__/testDb';
import { startApiTestClient, createTestUser } from '../../../testing/apiTestClient';
import type { ApiTestClient } from '../../../testing/apiTestClient';
import { User } from '../../users/user.model';
import { OnboardingResponse } from '../onboardingResponse.model';
import { Plan } from '../../plans/plan.model';
import { appEvents } from '../../../events/appEvents';
import type { TraineeOnboardedEvent } from '../../../events/appEvents';

const FULL_PAYLOAD = {
  name: 'Maya',
  birthDate: '1995-04-12',
  height: 165,
  weight: 60,
  gender: 'female',
  units: { weight: 'kg', distance: 'km' },
  goals: ['build_muscle'],
  trainingFrequency: { minDays: 3, maxDays: 4, flexibleSchedule: true },
  preferredActivities: ['gym_strength_training'],
  exercisePreferences: { favoriteExerciseNotes: 'Squats', muscleFocus: ['glutes'] },
  equipment: ['full_gym'],
  recovery: { flags: ['nothing_to_add'] },
};

let api: ApiTestClient;
let trainee: Awaited<ReturnType<typeof createTestUser>>;

describe('onboarding (OnboardingResponse)', () => {
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
    trainee = await createTestUser('maya@example.com');
  });

  it('starts empty', async () => {
    const res = await api.request('GET', '/onboarding', { token: trainee.token });
    expect(res.status).toBe(200);
    expect(res.body.onboarding).toMatchObject({ status: 'not_started', lastStep: null, answers: null });
  });

  it('saves one step, records it, and moves the status to in_progress', async () => {
    const res = await api.request('PATCH', '/onboarding', {
      token: trainee.token,
      body: {
        step: 'basic_profile',
        answers: { name: 'Maya T', birthDate: '1995-04-12', height: 165, weight: 60, units: { weight: 'kg', distance: 'km' } },
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: 'Maya T', onboardingStatus: 'in_progress', appState: 'onboarding' });
    expect(res.body.onboarding).toMatchObject({ lastStep: 'basic_profile', units: { weight: 'kg', distance: 'km' } });

    const stored = await OnboardingResponse.findOne({ userId: trainee.user._id }).lean();
    expect(stored?.answers.height).toBe(165);
    expect(stored?.answers.birthDate).toBeInstanceOf(Date);
  });

  it('merges steps instead of replacing earlier answers', async () => {
    await api.request('PATCH', '/onboarding', { token: trainee.token, body: { step: 'goals', answers: { goals: ['build_muscle'] } } });
    await api.request('PATCH', '/onboarding', {
      token: trainee.token,
      body: { step: 'equipment', answers: { equipment: ['dumbbells'] } },
    });
    const res = await api.request('GET', '/onboarding', { token: trainee.token });
    expect(res.body.onboarding.answers).toMatchObject({ goals: ['build_muscle'], equipment: ['dumbbells'] });
    expect(res.body.onboarding.lastStep).toBe('equipment');
  });

  it('rejects a field that belongs to another step', async () => {
    const res = await api.request('PATCH', '/onboarding', {
      token: trainee.token,
      body: { step: 'goals', answers: { equipment: ['dumbbells'] } },
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not part of the goals step/);
  });

  it('rejects invalid values with the existing messages', async () => {
    const res = await api.request('PATCH', '/onboarding', { token: trainee.token, body: { step: 'goals', answers: { goals: [] } } });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Goals must include at least one valid goal.');
  });

  it('rejects an unknown step', async () => {
    const res = await api.request('PATCH', '/onboarding', { token: trainee.token, body: { step: 'nope', answers: {} } });
    expect(res.status).toBe(400);
  });

  it('completes with server time and lands on waiting', async () => {
    const before = Date.now();
    const res = await api.request('POST', '/onboarding/complete', { token: trainee.token, body: FULL_PAYLOAD });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ onboardingStatus: 'completed', onboardingCompleted: true, appState: 'waiting' });
    expect(new Date(res.body.user.onboardingCompletedAt).getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(res.body.onboarding.completedAt).not.toBeNull();
  });

  it('requires every required answer to complete', async () => {
    const { equipment: _equipment, ...withoutEquipment } = FULL_PAYLOAD;
    const res = await api.request('POST', '/onboarding/complete', { token: trainee.token, body: withoutEquipment });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Equipment must include at least one valid option.');
  });

  it('never restarts the 48h window: re-completing and editing a step keep the first completion time', async () => {
    await api.request('POST', '/onboarding/complete', { token: trainee.token, body: FULL_PAYLOAD });
    const first = (await User.findById(trainee.id).lean())!.onboardingCompletedAt!.getTime();

    await api.request('PATCH', '/onboarding', { token: trainee.token, body: { step: 'goals', answers: { goals: ['lose_weight'] } } });
    await api.request('POST', '/onboarding/complete', { token: trainee.token, body: FULL_PAYLOAD });

    const user = (await User.findById(trainee.id).lean())!;
    expect(user.onboardingStatus).toBe('completed');
    expect(user.onboardingCompletedAt!.getTime()).toBe(first);
  });

  it("fires 'trainee.onboarded' once, on the first completion only", async () => {
    const listener = vi.fn<(event: TraineeOnboardedEvent) => void>();
    appEvents.on('trainee.onboarded', listener);
    try {
      await api.request('POST', '/onboarding/complete', { token: trainee.token, body: FULL_PAYLOAD });
      await api.request('POST', '/onboarding/complete', { token: trainee.token, body: FULL_PAYLOAD });
    } finally {
      appEvents.off('trainee.onboarded', listener);
    }

    expect(listener).toHaveBeenCalledTimes(1);
    const user = (await User.findById(trainee.id).lean())!;
    expect(listener.mock.calls[0][0]).toEqual({
      traineeId: trainee.id,
      coachId: user.coachId ? String(user.coachId) : null,
      completedAt: user.onboardingCompletedAt,
    });
  });

  it('a failing listener never fails the completion', async () => {
    const failing = () => {
      throw new Error('boom');
    };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    appEvents.on('trainee.onboarded', failing);
    try {
      const res = await api.request('POST', '/onboarding/complete', { token: trainee.token, body: FULL_PAYLOAD });
      expect(res.status).toBe(200);
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      appEvents.off('trainee.onboarded', failing);
      errorSpy.mockRestore();
    }
  });

  describe('GET /onboarding/waiting', () => {
    it('has no deadline before onboarding is finished', async () => {
      const res = await api.request('GET', '/onboarding/waiting', { token: trainee.token });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ appState: 'onboarding', planDueAt: null });
    });

    it('returns server time and a deadline 48h after the completion time', async () => {
      await api.request('POST', '/onboarding/complete', { token: trainee.token, body: FULL_PAYLOAD });
      const before = Date.now();
      const res = await api.request('GET', '/onboarding/waiting', { token: trainee.token });
      const after = Date.now();

      const user = (await User.findById(trainee.id).lean())!;
      expect(res.body.appState).toBe('waiting');
      expect(new Date(res.body.planDueAt).getTime()).toBe(user.onboardingCompletedAt!.getTime() + 48 * 60 * 60 * 1000);
      const serverTime = new Date(res.body.serverTime).getTime();
      expect(serverTime).toBeGreaterThanOrEqual(before);
      expect(serverTime).toBeLessThanOrEqual(after);
    });

    it('moves to home once a plan is published', async () => {
      await api.request('POST', '/onboarding/complete', { token: trainee.token, body: FULL_PAYLOAD });
      const coach = await createTestUser('coach@example.com', { role: 'coach' });
      await Plan.create({
        traineeId: trainee.id,
        coachId: coach.id,
        weekStartDate: '2026-09-27',
        status: 'published',
        publishedAt: new Date(),
        workouts: [],
      });

      const res = await api.request('GET', '/onboarding/waiting', { token: trainee.token });
      expect(res.body.appState).toBe('home');
    });

    it('is trainee-only and needs a session', async () => {
      const coach = await createTestUser('coach@example.com', { role: 'coach' });
      expect((await api.request('GET', '/onboarding/waiting', { token: coach.token })).status).toBe(403);
      expect((await api.request('GET', '/onboarding/waiting')).status).toBe(401);
    });
  });

  it('GET /users/profile keeps the ATLAS response shape for the Profile page', async () => {
    await api.request('POST', '/onboarding/complete', { token: trainee.token, body: FULL_PAYLOAD });
    const res = await api.request('GET', '/users/profile', { token: trainee.token });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: 'Maya',
      onboardingCompleted: true,
      profile: { height: 165, goals: ['build_muscle'], equipment: ['full_gym'] },
      preferences: { units: { weight: 'kg', distance: 'km' } },
    });
  });

  it('the old PUT /users/profile is gone', async () => {
    const res = await api.request('PUT', '/users/profile', { token: trainee.token, body: FULL_PAYLOAD });
    expect(res.status).toBe(404);
  });
});
