import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { CoachStats } from '@sistem/types';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../exercises/__tests__/testDb';
import { startApiTestClient, createTestUser } from '../../../testing/apiTestClient';
import type { ApiTestClient } from '../../../testing/apiTestClient';
import { OnboardingResponse } from '../../onboarding/onboardingResponse.model';
import { Plan } from '../../plans/plan.model';
import { addDays, currentWeekStart, localDateString } from '../../plans/planWeek';
import { WorkoutLog } from '../../workoutLogs/workoutLog.model';
import { addMonths, addMonthsToDate, lastDayOfMonth, parseStatsRange } from '../coachStats';

// GET /coach/stats: the dashboard's Statistics and Overview numbers — read-only, the calling
// coach's own trainees only.

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

const TIMEZONE = 'Asia/Jerusalem';
const THIS_WEEK = currentWeekStart(TIMEZONE);
const LAST_WEEK = addDays(THIS_WEEK, -7);
const TODAY = localDateString(new Date(), TIMEZONE);
const HOUR_MS = 60 * 60 * 1000;
// Any valid id: these tests never read the exercise itself.
const EXERCISE_ID = '64b000000000000000000001';

let api: ApiTestClient;
let coach: TestUser;
let trainee: TestUser;

async function createPlan(owner: TestUser, coachUser: TestUser, weekStartDate: string, status: 'draft' | 'published' = 'published') {
  return Plan.create({
    traineeId: owner.user._id,
    coachId: coachUser.user._id,
    weekStartDate,
    status,
    publishedAt: status === 'published' ? new Date() : null,
    workouts: [
      { title: 'Lower Body', dayOfWeek: 0, order: 0, exercises: [{ exerciseId: EXERCISE_ID, sets: 3, reps: 10 }] },
      { title: 'Any day', order: 1, exercises: [{ exerciseId: EXERCISE_ID, sets: 2, reps: 8 }] },
    ],
  });
}

async function completeWorkout(plan: Awaited<ReturnType<typeof createPlan>>, index: number, fields: Record<string, unknown> = {}) {
  return WorkoutLog.create({
    traineeId: plan.traineeId,
    planId: plan._id,
    workoutId: plan.workouts[index]._id,
    workoutTitle: plan.workouts[index].title,
    status: 'completed',
    finishedAt: new Date(),
    sets: [{ exerciseId: EXERCISE_ID, setIndex: 0, type: 'working', reps: 10, weight: 40, completed: true }],
    ...fields,
  });
}

async function getStats(token: string, query = ''): Promise<CoachStats> {
  const res = await api.request<CoachStats>('GET', `/coach/stats${query}`, { token });
  expect(res.status).toBe(200);
  return res.body;
}

describe('coach stats', () => {
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
    coach = await createTestUser('coach@example.com', { role: 'coach', timezone: TIMEZONE });
    trainee = await createTestUser('t@example.com', {
      coachId: coach.user._id,
      timezone: TIMEZONE,
      onboardingStatus: 'completed',
      onboardingCompletedAt: new Date(Date.now() - 30 * HOUR_MS),
    });
  });

  it('needs a coach', async () => {
    expect((await api.request('GET', '/coach/stats')).status).toBe(401);
    expect((await api.request('GET', '/coach/stats', { token: trainee.token })).status).toBe(403);
  });

  it('a coach without trainees gets zeros, not errors', async () => {
    const lonely = await createTestUser('lonely@example.com', { role: 'coach', timezone: TIMEZONE });
    const stats = await getStats(lonely.token);
    expect(stats.summary).toMatchObject({
      activeTrainees: 0,
      newTraineesThisMonth: 0,
      plannedWorkouts: 0,
      hoursToFirstPlan: null,
      averageRating: null,
    });
    expect(stats.thisWeek).toEqual({ planned: 0, completed: 0 });
    expect(stats.trainees).toEqual([]);
    expect(stats.pump).toEqual({ newCount: 0, total: 0, photos: [] });
  });

  it('the range picks the months shown; anything else reads as 6', async () => {
    expect((await getStats(coach.token, '?range=3')).activeByMonth).toHaveLength(3);
    expect((await getStats(coach.token, '?range=12')).activeByMonth).toHaveLength(12);
    const fallback = await getStats(coach.token, '?range=99');
    expect(fallback.range).toBe(6);
    expect(fallback.activeByMonth).toHaveLength(6);
    expect(fallback.activeByMonth.at(-1)?.month).toBe(TODAY.slice(0, 7));
  });

  it("this week: planned and done workouts of the week's published plans", async () => {
    const plan = await createPlan(trainee, coach, THIS_WEEK);
    await completeWorkout(plan, 0, { rating: 4, stats: { durationSec: 600, totalVolume: 400, setsCompleted: 1, prCount: 2 } });

    const stats = await getStats(coach.token);
    expect(stats.thisWeek).toEqual({ planned: 2, completed: 1 });
    expect(stats.weeklyWorkouts).toHaveLength(8);
    expect(stats.weeklyWorkouts.at(-1)).toEqual({ weekStartDate: THIS_WEEK, planned: 2, completed: 1 });
    expect(stats.summary).toMatchObject({ activeTrainees: 1, averageRating: 4, ratingCount: 1 });
    expect(stats.recentPrs).toEqual([{ logId: expect.any(String), prCount: 2 }]);

    const [week] = stats.trainees;
    expect(week.traineeId).toBe(trainee.id);
    expect(week.currentPlan).toMatchObject({ id: String(plan._id), planned: 2, completed: 1 });
    expect(week.currentPlan?.workouts[0].status).toBe('done');
    expect(week.nextWeekPlan).toBeNull();
    expect(week.days).toHaveLength(7);
    expect(week.days.at(-1)).toEqual({ date: TODAY, cell: 'done' });
  });

  it('the completion rate counts ended weeks only, and drafts never count', async () => {
    const lastWeek = await createPlan(trainee, coach, LAST_WEEK);
    await completeWorkout(lastWeek, 0, { finishedAt: new Date(Date.now() - 8 * 24 * HOUR_MS) });
    await createPlan(trainee, coach, THIS_WEEK);
    await createPlan(trainee, coach, addDays(THIS_WEEK, 7), 'draft');

    const stats = await getStats(coach.token);
    expect(stats.summary).toMatchObject({ plannedWorkouts: 2, completedWorkouts: 1 });
    expect(stats.thisWeek).toEqual({ planned: 2, completed: 0 });
    expect(stats.trainees[0].nextWeekPlan).toMatchObject({ status: 'draft' });
    // Last week's Sunday workout was done; its other workout has no day, so it is on no day of the board.
    expect(stats.trainees[0].days.filter((day) => day.cell === 'missed' && day.date < THIS_WEEK)).toEqual([]);
  });

  it('a dated workout whose day passed is a miss on the board', async () => {
    await createPlan(trainee, coach, LAST_WEEK);
    const stats = await getStats(coach.token);
    // Last Sunday is one of the last 7 days on every day but a Sunday (then it is 7 days back).
    const lastSunday = stats.trainees[0].days.find((day) => day.date === LAST_WEEK);
    if (lastSunday) expect(lastSunday.cell).toBe('missed');
    expect(stats.trainees[0].days.every((day) => day.cell !== 'done')).toBe(true);
  });

  it('goals, days per week and the wait for the first plan come from her onboarding', async () => {
    await OnboardingResponse.create({
      userId: trainee.user._id,
      answers: { goals: ['lose_weight', 'build_muscle'], trainingFrequency: { minDays: 3, maxDays: 4 } },
    });
    await createPlan(trainee, coach, THIS_WEEK);

    const stats = await getStats(coach.token);
    expect(stats.trainees[0]).toMatchObject({ goals: ['lose_weight', 'build_muscle'], daysPerWeek: { min: 3, max: 4 } });
    expect(stats.goals).toEqual(
      expect.arrayContaining([
        { goalId: 'lose_weight', count: 1 },
        { goalId: 'build_muscle', count: 1 },
      ]),
    );
    // Onboarding finished 30 hours before the plan was published.
    expect(stats.summary.firstPlanCount).toBe(1);
    expect(stats.summary.hoursToFirstPlan).toBeGreaterThan(29);
    expect(stats.summary.hoursToFirstPlan).toBeLessThan(31);
  });

  it("another coach's trainees are never counted", async () => {
    const otherCoach = await createTestUser('other-coach@example.com', { role: 'coach', timezone: TIMEZONE });
    const theirs = await createTestUser('theirs@example.com', {
      coachId: otherCoach.user._id,
      timezone: TIMEZONE,
      onboardingStatus: 'completed',
      onboardingCompletedAt: new Date(),
    });
    const theirPlan = await createPlan(theirs, otherCoach, THIS_WEEK);
    await completeWorkout(theirPlan, 0, { rating: 1 });

    const mine = await getStats(coach.token);
    expect(mine.summary).toMatchObject({ activeTrainees: 0, averageRating: null });
    expect(mine.thisWeek).toEqual({ planned: 0, completed: 0 });
    expect(mine.trainees.map((week) => week.traineeId)).toEqual([trainee.id]);

    const others = await getStats(otherCoach.token);
    expect(others.trainees.map((week) => week.traineeId)).toEqual([theirs.id]);
    expect(others.thisWeek).toEqual({ planned: 2, completed: 1 });
  });

  it('retention: who still has a published plan N months after onboarding', async () => {
    const veteran = await createTestUser('veteran@example.com', {
      coachId: coach.user._id,
      timezone: TIMEZONE,
      onboardingStatus: 'completed',
      onboardingCompletedAt: new Date(Date.now() - 100 * 24 * HOUR_MS),
    });
    await createPlan(veteran, coach, THIS_WEEK);

    const stats = await getStats(coach.token);
    // The veteran passed 1 and 3 months and still has a plan; nobody passed 6 months yet.
    expect(stats.retention).toEqual([
      { months: 1, eligible: 1, retained: 1 },
      { months: 3, eligible: 1, retained: 1 },
      { months: 6, eligible: 0, retained: 0 },
    ]);
  });
});

describe('coach stats — month helpers', () => {
  it('walks months across a year end', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(lastDayOfMonth('2026-02')).toBe('2026-02-28');
    expect(lastDayOfMonth('2028-02')).toBe('2028-02-29');
  });

  it('a day the month does not have becomes its last day', () => {
    expect(addMonthsToDate('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsToDate('2026-10-11', -6)).toBe('2026-04-11');
  });

  it('reads only 3, 6 and 12 as a range', () => {
    expect(parseStatsRange('3')).toBe(3);
    expect(parseStatsRange('12')).toBe(12);
    expect(parseStatsRange(undefined)).toBe(6);
    expect(parseStatsRange('7')).toBe(6);
  });
});
