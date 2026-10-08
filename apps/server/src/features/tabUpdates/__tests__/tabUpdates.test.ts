import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../exercises/__tests__/testDb';
import { startApiTestClient, createTestUser } from '../../../testing/apiTestClient';
import type { ApiTestClient } from '../../../testing/apiTestClient';
import { Exercise } from '../../exercises/exercise.model';
import { Plan } from '../../plans/plan.model';
import { currentWeekStart } from '../../plans/planWeek';
import { User } from '../../users/user.model';
import { NutritionPlanVersion } from '../../nutrition/nutritionPlan.model';

// Phase 13a (owner decision): the "unseen update" dots on the trainee's tab bar —
// Workouts for a new / changed training plan, Nutrition for a new nutrition version —
// cleared when she opens the tab. "Last seen" is stored on the server.

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

let api: ApiTestClient;
let coach: TestUser;
let trainee: TestUser;
let exerciseId: string;

const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

async function updates(user = trainee) {
  const res = await api.request('GET', '/tab-updates', { token: user.token });
  expect(res.status).toBe(200);
  return res.body;
}

async function seen(tab: string) {
  return api.request('POST', '/tab-updates/seen', { token: trainee.token, body: { tab } });
}

function workouts(title = 'Full body') {
  return [{ title, exercises: [{ exerciseId, sets: 3, reps: 10 }] }];
}

describe('tab updates (trainee tab dots)', () => {
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
    coach = await createTestUser('coach@example.com', { role: 'coach' });
    trainee = await createTestUser('maya@example.com', {
      coachId: coach.user._id,
      onboardingStatus: 'completed',
      onboardingCompletedAt: new Date(),
    });
    const exercise = await Exercise.create({
      slug: 'squat',
      name: 'Squat',
      primaryMuscles: ['quadriceps'],
      equipment: ['barbell'],
      difficulty: 'beginner',
      movementType: 'strength',
      source: { provider: 'kaggle', dataset: 'test', importedAt: new Date() },
    });
    exerciseId = String(exercise._id);
  });

  it('nothing published: no dots', async () => {
    expect(await updates()).toEqual({ workouts: false, nutrition: false });
  });

  it('Workouts: a published plan, then a change to it, each light the dot until she opens the tab', async () => {
    const plansPath = `/coach/trainees/${trainee.id}/plans`;
    const draft = (await api.request('POST', plansPath, { token: coach.token, body: { weekStartDate: currentWeekStart('Asia/Jerusalem') } })).body.plan;
    await api.request('PUT', `${plansPath}/${draft.id}`, { token: coach.token, body: { workouts: workouts() } });
    expect((await updates()).workouts).toBe(false);

    await api.request('POST', `${plansPath}/${draft.id}/publish`, { token: coach.token });
    expect((await updates()).workouts).toBe(true);

    await tick();
    const cleared = await seen('workouts');
    expect(cleared.body).toEqual({ workouts: false, nutrition: false });

    await tick();
    await api.request('PUT', `${plansPath}/${draft.id}`, { token: coach.token, body: { workouts: workouts('Lower body') } });
    expect((await updates()).workouts).toBe(true);
  });

  it('Workouts: a plan published before Phase 13a (no liveUpdatedAt) still counts', async () => {
    await Plan.create({
      traineeId: trainee.user._id,
      coachId: coach.user._id,
      weekStartDate: currentWeekStart('Asia/Jerusalem'),
      status: 'published',
      publishedAt: new Date(),
      workouts: [],
    });
    expect((await updates()).workouts).toBe(true);
  });

  it('Nutrition: a new version lights the dot; seen is stored on the server (any device)', async () => {
    const version = { traineeId: trainee.user._id, coachId: coach.user._id, calorieTarget: { goal: 'recomp' as const }, groupKcal: { protein: 150, carb: 120, fat: 90, vegetable: 0 }, dayKcal: 0 };
    await NutritionPlanVersion.create({ ...version, planId: coach.user._id, version: 1, publishedAt: new Date() });
    expect((await updates()).nutrition).toBe(true);

    await tick();
    await seen('nutrition');
    expect((await User.findById(trainee.user._id).lean())?.tabSeenAt?.nutrition).toBeInstanceOf(Date);
    expect((await updates()).nutrition).toBe(false);

    await tick();
    await NutritionPlanVersion.create({ ...version, planId: coach.user._id, version: 2, publishedAt: new Date() });
    expect((await updates()).nutrition).toBe(true);
  });

  it('trainee only, and a known tab only', async () => {
    expect((await api.request('GET', '/tab-updates', { token: coach.token })).status).toBe(403);
    expect((await seen('profile')).status).toBe(400);
  });
});
