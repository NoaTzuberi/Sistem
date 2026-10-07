import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../exercises/__tests__/testDb';
import { startApiTestClient, createTestUser } from '../../../testing/apiTestClient';
import type { ApiTestClient } from '../../../testing/apiTestClient';
import { config } from '../../../config/env';
import { aiClient } from '../../ai/ai.client';
import { AI_CONFIG } from '../../ai/ai.config';
import { AiProviderError } from '../../ai/ai.types';
import type { AiJsonRequest, AiJsonResponse } from '../../ai/ai.types';
import { Exercise } from '../../exercises/exercise.model';
import { Notification } from '../../notifications/notification.model';
import { Plan } from '../../plans/plan.model';
import { currentWeekStart } from '../../plans/planWeek';
import { AiRecommendation } from '../aiRecommendation.model';
import { failInterruptedRecommendations, startRecommendation } from '../aiRecommendation.service';

// Phase 12 (PRD §8): onboarding → a background AI draft for the coach → validated in code,
// retried with its issues → the coach loads it into a plan. The model is always faked.

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

const ONBOARDING = {
  name: 'Maya',
  birthDate: '1995-04-12',
  height: 165,
  weight: 60,
  gender: 'female',
  units: { weight: 'kg', distance: 'km' },
  goals: ['build_muscle'],
  trainingFrequency: { minDays: 3, maxDays: 3, flexibleSchedule: false },
  preferredActivities: ['gym_strength_training'],
  exercisePreferences: { favoriteExerciseNotes: 'Hip thrusts. Text me on 054-123-4567', muscleFocus: ['glutes'] },
  equipment: ['full_gym'],
  recovery: { flags: ['has_injury_or_limitation'], notes: 'Old knee injury, email maya@example.com' },
};

const MUSCLES = ['quadriceps', 'hamstrings', 'glutes', 'chest', 'lats', 'shoulders', 'biceps', 'triceps', 'abdominals'];

let api: ApiTestClient;
let coach: TestUser;
let otherCoach: TestUser;
let trainee: TestUser;
let generate: MockInstance<typeof aiClient.generateJson>;
let savedKey: string;

async function seedExercises(count = 27) {
  await Exercise.insertMany(
    Array.from({ length: count }, (_, i) => ({
      slug: `exercise-${i}`,
      name: `Exercise ${String(i).padStart(2, '0')}`,
      primaryMuscles: [MUSCLES[i % MUSCLES.length]],
      equipment: ['barbell'],
      difficulty: 'beginner',
      movementType: 'strength',
      source: { provider: 'kaggle', dataset: 'test', importedAt: new Date() },
    })),
  );
}

/** The aliases the prompt listed (E001 …). */
function aliasesIn(request: AiJsonRequest): string[] {
  return [...request.messages[0].text.matchAll(/^(E\d{3}) \|/gm)].map((match) => match[1]);
}

function validReply(request: AiJsonRequest, workouts = 3) {
  const aliases = aliasesIn(request);
  return {
    summary: 'Three full-body sessions.',
    split: 'Full body x3 fits three days.',
    considerations: ['Check the knee before loading squats.'],
    workouts: Array.from({ length: workouts }, (_, w) => ({
      title: `Full body ${w + 1}`,
      dayOfWeek: w * 2,
      focus: 'Whole body strength.',
      exercises: aliases.slice(w * 4, w * 4 + 4).map((alias, e) => ({
        exercise: alias,
        sets: 3,
        reps: 8,
        repsMax: 12,
        durationSec: null,
        restSec: 90,
        supersetGroup: e >= 2 ? 'A' : null,
        why: `Reason ${alias}.`,
      })),
    })),
  };
}

function reply(body: unknown, finish: AiJsonResponse['finish'] = 'stop'): AiJsonResponse {
  return { text: JSON.stringify(body), model: 'fake-model', finish, usage: { inputTokens: 100, outputTokens: 50, thinkingTokens: 10 } };
}

async function completeOnboarding(user = trainee) {
  const res = await api.request('POST', '/onboarding/complete', { token: user.token, body: ONBOARDING });
  expect(res.status).toBe(200);
}

async function waitForStatus(traineeId: string, statuses: string[]) {
  for (let i = 0; i < 200; i += 1) {
    const doc = await AiRecommendation.findOne({ traineeId }).sort({ createdAt: -1 }).lean();
    if (doc && statuses.includes(doc.status)) return doc;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`No recommendation reached ${statuses.join('/')}`);
}

function latest(traineeId = trainee.id, user = coach) {
  return api.request('GET', `/coach/trainees/${traineeId}/ai-recommendations/latest`, { token: user.token });
}

describe('AI plan recommendations', () => {
  beforeAll(async () => {
    await connectTestDatabase();
    await AiRecommendation.init();
    api = await startApiTestClient();
  });

  afterAll(async () => {
    await api.close();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    savedKey = config.ai.geminiApiKey;
    config.ai.geminiApiKey = 'test-key';
    coach = await createTestUser('coach@example.com', { role: 'coach' });
    otherCoach = await createTestUser('other-coach@example.com', { role: 'coach' });
    trainee = await createTestUser('maya@example.com', { coachId: coach.user._id });
    await seedExercises();
    generate = vi.spyOn(aiClient, 'generateJson').mockImplementation(async (request) => reply(validReply(request)));
  });

  afterEach(() => {
    config.ai.geminiApiKey = savedKey;
    vi.restoreAllMocks();
  });

  it('drafts a plan when onboarding completes, without her name, email or phone', async () => {
    await completeOnboarding();
    const doc = await waitForStatus(trainee.id, ['ready', 'failed']);

    expect(doc.status).toBe('ready');
    expect(doc.trigger).toBe('onboarding');
    expect(generate).toHaveBeenCalledTimes(1);

    const request = generate.mock.calls[0][0] as AiJsonRequest;
    const sent = JSON.stringify(request);
    expect(sent).not.toContain('Maya');
    expect(sent).not.toContain('maya@example.com');
    expect(sent).not.toContain('054-123-4567');
    expect(sent).not.toContain('1995');
    expect(sent).not.toContain(trainee.id);
    expect(sent).toContain('Old knee injury, email [email removed]');
    expect(request.system).toContain('for a personal coach');

    const res = await latest();
    expect(res.status).toBe(200);
    expect(res.body.unavailableReason).toBeNull();
    const recommendation = res.body.recommendation;
    expect(recommendation).toMatchObject({ status: 'ready', trigger: 'onboarding', model: 'fake-model', attemptCount: 1, error: null });
    expect(recommendation.input.profile).toMatchObject({ ageYears: expect.any(Number), recoveryFlags: ['has_injury_or_limitation'] });
    expect(recommendation.input.candidates).toBeUndefined();
    expect(recommendation.input.guidanceNote).toBeTruthy(); // no embeddings key in tests
    expect(recommendation.output.summary).toBe('Three full-body sessions.');
    const first = recommendation.output.workouts[0].exercises[0];
    expect(first).toMatchObject({ sets: 3, reps: 8, repsMax: 12, restSec: 90, why: expect.stringMatching(/^Reason E\d{3}\.$/) });
    expect(first.exercise.name).toMatch(/^Exercise \d\d$/);
    expect(first).not.toHaveProperty('targetWeight');
    expect(first).not.toHaveProperty('notes');
  });

  it('returns a timed exercise without null fields (MongoDB stores undefined as null)', async () => {
    generate.mockImplementation(async (request) => {
      const timed = validReply(request);
      Object.assign(timed.workouts[0].exercises[3], { reps: null, repsMax: null, durationSec: 45, supersetGroup: null });
      timed.workouts[0].exercises[2].supersetGroup = null;
      return reply(timed);
    });

    await completeOnboarding();
    await waitForStatus(trainee.id, ['ready']);
    const plank = (await latest()).body.recommendation.output.workouts[0].exercises[3];

    expect(plank).toMatchObject({ sets: 3, durationSec: 45, restSec: 90 });
    expect(plank).not.toHaveProperty('reps');
    expect(plank).not.toHaveProperty('repsMax');
    expect(plank).not.toHaveProperty('supersetGroup');
  });

  it('sends the issues back and retries until the draft passes the plan rules', async () => {
    generate
      .mockImplementationOnce(async (request) => {
        const bad = validReply(request);
        bad.workouts[0].exercises[0].exercise = 'E199'; // not in this request's list
        bad.workouts[1].exercises[0].supersetGroup = 'B'; // a superset of one
        return reply(bad);
      })
      .mockImplementationOnce(async () => reply({}, 'max_tokens'));

    await completeOnboarding();
    const doc = await waitForStatus(trainee.id, ['ready', 'failed']);

    expect(doc.status).toBe('ready');
    expect(doc.attempts).toHaveLength(3);
    expect(doc.attempts[0].issues.join(' ')).toContain('E199');
    expect(doc.attempts[1].issues[0]).toContain('cut off');

    const second = generate.mock.calls[1][0] as AiJsonRequest;
    expect(second.messages).toHaveLength(3);
    expect(second.messages[1].role).toBe('model');
    expect(second.messages[2].text).toContain('E199');
  });

  it('catches the plan rules the dashboard enforces, and the AI-only rules', async () => {
    generate.mockImplementation(async (request) => {
      const bad = validReply(request, 2); // she trains 3 days
      bad.workouts[1].dayOfWeek = bad.workouts[0].dayOfWeek;
      bad.workouts[0].exercises[1].exercise = bad.workouts[0].exercises[0].exercise;
      bad.workouts[0].exercises[2].reps = 12;
      bad.workouts[0].exercises[2].repsMax = 8;
      return reply(bad);
    });

    await completeOnboarding();
    const doc = await waitForStatus(trainee.id, ['ready', 'failed']);

    expect(doc.status).toBe('failed');
    expect(doc.error?.code).toBe('invalid_output');
    expect(doc.attempts).toHaveLength(AI_CONFIG.maxAttempts);
    const issues = doc.attempts[0].issues.join('\n');
    expect(issues).toMatch(/Workout 1 \("Full body 1"\), exercise 3 \(E\d{3} Exercise \d\d\): /);
    expect(issues).toContain('Plan 3 workouts');
    expect(issues).toContain('already used by Workout 1');
    expect(issues).toContain('the same exercise is already in this workout');
  });

  it('marks the draft failed with the provider error (no retry loop on top of the provider)', async () => {
    generate.mockRejectedValue(new AiProviderError('quota_exhausted', 'Daily free quota used.', 'gemini-x'));

    await completeOnboarding();
    const doc = await waitForStatus(trainee.id, ['ready', 'failed']);

    expect(doc).toMatchObject({ status: 'failed', active: false, error: { code: 'quota_exhausted', message: 'Daily free quota used.' } });
    expect(generate).toHaveBeenCalledTimes(1);
    expect((await latest()).body.recommendation.error.code).toBe('quota_exhausted');
  });

  it('does not ask the model when too few exercises fit her equipment', async () => {
    await Exercise.deleteMany({});
    await seedExercises(5);

    await completeOnboarding();
    const doc = await waitForStatus(trainee.id, ['failed']);

    expect(doc.error?.code).toBe('not_enough_data');
    expect(generate).not.toHaveBeenCalled();
  });

  it('runs nothing when the AI is not set up, and says why', async () => {
    config.ai.geminiApiKey = '';

    await completeOnboarding();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(await AiRecommendation.countDocuments()).toBe(0);

    const res = await latest();
    expect(res.body).toMatchObject({ recommendation: null, unavailableReason: expect.stringContaining('GEMINI_API_KEY') });
    const post = await api.request('POST', `/coach/trainees/${trainee.id}/ai-recommendations`, {
      token: coach.token,
      body: { type: 'training_plan' },
    });
    expect(post.status).toBe(503);
  });

  it('lets the coach regenerate, one run at a time', async () => {
    await completeOnboarding();
    await waitForStatus(trainee.id, ['ready']);

    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    generate.mockImplementationOnce(async (request) => {
      await held;
      return reply(validReply(request));
    });

    const path = `/coach/trainees/${trainee.id}/ai-recommendations`;
    const first = await api.request('POST', path, { token: coach.token, body: { type: 'training_plan' } });
    expect(first.status).toBe(202);
    expect(first.body.recommendation).toMatchObject({ trigger: 'coach', status: 'pending' });

    await waitForStatus(trainee.id, ['running']);
    const second = await api.request('POST', path, { token: coach.token, body: { type: 'training_plan' } });
    expect(second.status).toBe(409);
    expect(second.body.recommendation.id).toBe(first.body.recommendation.id);

    release();
    await waitForStatus(trainee.id, ['ready']);
    expect(await AiRecommendation.countDocuments({ traineeId: trainee.id })).toBe(2);
    expect((await latest()).body.recommendation.id).toBe(first.body.recommendation.id);

    const bad = await api.request('POST', path, { token: coach.token, body: { type: 'nutrition' } });
    expect(bad.status).toBe(400);
  });

  it('is coach-only: the trainee gets 403, another coach 404', async () => {
    await completeOnboarding();
    const doc = await waitForStatus(trainee.id, ['ready']);
    const byId = `/coach/trainees/${trainee.id}/ai-recommendations/${doc._id}`;

    expect((await latest(trainee.id, trainee)).status).toBe(403);
    expect((await api.request('GET', byId, { token: trainee.token })).status).toBe(403);
    expect((await latest(trainee.id, otherCoach)).status).toBe(404);
    expect((await api.request('GET', byId, { token: otherCoach.token })).status).toBe(404);
    expect((await api.request('GET', byId, { token: coach.token })).status).toBe(200);

    // Another of her trainees can't be used to read this one's draft.
    const second = await createTestUser('noa@example.com', { coachId: coach.user._id });
    expect((await api.request('GET', `/coach/trainees/${second.id}/ai-recommendations/${doc._id}`, { token: coach.token })).status).toBe(404);
  });

  it('never reaches the trainee: no notification, no plan, until the coach publishes', async () => {
    await completeOnboarding();
    await waitForStatus(trainee.id, ['ready']);

    expect(await Plan.countDocuments({ traineeId: trainee.id })).toBe(0);
    expect(await Notification.countDocuments({ userId: trainee.id })).toBe(0);
    const plans = await api.request('GET', '/plans', { token: trainee.token });
    expect(plans.body.items).toEqual([]);
  });

  it('links a plan to the draft it was loaded from (coach-only), and checks the link', async () => {
    await completeOnboarding();
    const doc = await waitForStatus(trainee.id, ['ready']);
    const recommendation = (await latest()).body.recommendation;

    const plansPath = `/coach/trainees/${trainee.id}/plans`;
    const created = await api.request('POST', plansPath, { token: coach.token, body: { weekStartDate: currentWeekStart('Asia/Jerusalem') } });
    const planId = created.body.plan.id;
    const workouts = recommendation.output.workouts.map((workout: { title: string; dayOfWeek: number; exercises: { exerciseId: string; sets: number; reps: number; repsMax: number; restSec: number }[] }) => ({
      title: workout.title,
      dayOfWeek: workout.dayOfWeek,
      exercises: workout.exercises.map(({ exerciseId, sets, reps, repsMax, restSec }) => ({ exerciseId, sets, reps, repsMax, restSec })),
    }));

    const saved = await api.request('PUT', `${plansPath}/${planId}`, {
      token: coach.token,
      body: { workouts, aiRecommendationId: String(doc._id) },
    });
    expect(saved.status).toBe(200);
    expect(saved.body.plan.aiRecommendationId).toBe(String(doc._id));

    // Omitted keeps the link; the trainee's own plan view never shows it.
    const kept = await api.request('PUT', `${plansPath}/${planId}`, { token: coach.token, body: { workouts } });
    expect(kept.body.plan.aiRecommendationId).toBe(String(doc._id));
    await api.request('POST', `${plansPath}/${planId}/publish`, { token: coach.token });
    const hers = await api.request('GET', '/plans', { token: trainee.token });
    expect(hers.body.items).toHaveLength(1);
    expect(hers.body.items[0]).not.toHaveProperty('aiRecommendationId');
    expect(JSON.stringify(hers.body)).not.toContain('Reason E');

    // Someone else's recommendation can't be linked; null clears.
    const other = await createTestUser('noa@example.com', { coachId: coach.user._id });
    const foreign = await AiRecommendation.create({
      traineeId: other.id, coachId: coach.id, type: 'training_plan', status: 'ready', trigger: 'coach', active: false,
    });
    const refused = await api.request('PUT', `${plansPath}/${planId}`, {
      token: coach.token,
      body: { workouts, aiRecommendationId: String(foreign._id) },
    });
    expect(refused.status).toBe(400);
    expect(refused.body.issues[0].message).toContain('AI recommendation');
    const cleared = await api.request('PUT', `${plansPath}/${planId}`, { token: coach.token, body: { workouts, aiRecommendationId: null } });
    expect(cleared.body.plan).not.toHaveProperty('aiRecommendationId');
  });

  it('marks drafts left running by a stopped server as failed', async () => {
    generate.mockImplementation(() => new Promise(() => {}));
    await completeOnboarding();
    await waitForStatus(trainee.id, ['running']);
    // A second start while one is active returns that one.
    const again = await startRecommendation({ traineeId: trainee.id, coachId: coach.id, type: 'training_plan', trigger: 'coach' });
    expect(again.created).toBe(false);

    expect(await failInterruptedRecommendations()).toBe(1);
    const doc = await AiRecommendation.findOne({ traineeId: trainee.id }).lean();
    expect(doc).toMatchObject({ status: 'failed', active: false, error: { code: 'interrupted' } });
  });
});
