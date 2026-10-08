import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../exercises/__tests__/testDb';
import { startApiTestClient, createTestUser } from '../../../testing/apiTestClient';
import type { ApiTestClient } from '../../../testing/apiTestClient';
import { addDays, localDateString, weekStartOf } from '../../plans/planWeek';
import { FoodItem } from '../../nutrition/foodItem.model';
import { NutritionPlanVersion } from '../../nutrition/nutritionPlan.model';
import { MealLog } from '../mealLog.model';

// Portion tracking (Phase 13a+, PRD §5.6): marks per group for a day against that day's
// plan, private meal photos, the 7-day window, and the coach's read-only week. Cloudinary
// is replaced by a fake (the real private-photo flow is the Phase 9 one).

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
const DAY_MS = 24 * 60 * 60 * 1000;

let api: ApiTestClient;
let coach: TestUser;
let otherCoach: TestUser;
let trainee: TestUser;
let today: string;
let proteinId: string;

function mark(date: string, eaten: Record<string, number>, user = trainee) {
  return api.request('PUT', `/meal-logs/${date}`, { token: user.token, body: { eaten } });
}

function uploadPhoto(date: string, mealId: string, data = JPEG) {
  return api.request('PUT', `/meal-logs/${date}/photos/${mealId}`, { token: trainee.token, raw: { data, contentType: 'image/jpeg' } });
}

async function days() {
  const res = await api.request('GET', '/meal-logs', { token: trainee.token });
  expect(res.status).toBe(200);
  return res.body as { today: string; days: { date: string; planned: object; eaten: object; logged: boolean; planVersion: number | null; meals: { id: string; name: string }[]; photos: { mealId: string; mealName: string; url: string }[] }[] };
}

/** Publishes a plan of `meals` meals, each 1 protein · 1 carb · 1 fat (+ `extraProtein` on the first). */
async function publishPlan(meals: number, extraProtein = 0) {
  const body = {
    calorieTarget: { kcal: 1500, source: 'override', goal: 'fat_loss', formulaSex: null, confirmBelowFloor: false },
    tips: [],
    meals: Array.from({ length: meals }, (_, index) => ({
      name: `Meal ${index + 1}`,
      portions: { protein: 1 + (index === 0 ? extraProtein : 0), carb: 1, fat: 1 },
      vegetablesFree: true,
      options: [{ label: 'A', lines: [{ kind: 'food', foodItemId: proteinId, portions: 1 }] }],
    })),
  };
  const path = `/coach/trainees/${trainee.id}/nutrition-plan`;
  expect((await api.request('PUT', path, { token: coach.token, body })).status).toBe(200);
  expect((await api.request('POST', `${path}/publish`, { token: coach.token })).status).toBe(200);
}

describe('portion tracking (meal logs)', () => {
  beforeAll(async () => {
    await connectTestDatabase();
    api = await startApiTestClient();
    await Promise.all([MealLog.init(), NutritionPlanVersion.init(), FoodItem.init()]);
  });

  afterAll(async () => {
    await api.close();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    storage.reset();
    coach = await createTestUser('coach@example.com', { role: 'coach' });
    otherCoach = await createTestUser('other-coach@example.com', { role: 'coach' });
    trainee = await createTestUser('maya@example.com', { coachId: coach.user._id, timezone: TIMEZONE });
    today = localDateString(new Date(), TIMEZONE);
    const food = await api.request('POST', '/coach/nutrition/foods', {
      token: coach.token,
      body: { group: 'protein', name: 'Cottage', portion: '150 g' },
    });
    proteinId = food.body.item.id;
  });

  it('shows her 7-day window; without a plan nothing can be marked', async () => {
    const window = await days();
    expect(window.today).toBe(today);
    expect(window.days.map((day) => day.date)).toEqual(Array.from({ length: 7 }, (_, index) => addDays(today, index - 6)));
    expect(window.days.every((day) => day.planVersion === null && !day.logged)).toBe(true);
    expect((await mark(today, { protein: 1 })).status).toBe(409);
  });

  it('marks today against the newest plan — clamped to what is planned, in halves', async () => {
    await publishPlan(2);
    const res = await mark(today, { protein: 1.5, carb: 5, fat: 0, snack: 0 });
    expect(res.status).toBe(200);
    expect(res.body.day).toMatchObject({
      date: today,
      planned: { protein: 2, carb: 2, fat: 2, snack: 0 },
      eaten: { protein: 1.5, carb: 2, fat: 0, snack: 0 },
      planVersion: 1,
      editable: true,
      logged: true,
    });
    expect(res.body.day.meals.map((meal: { name: string }) => meal.name)).toEqual(['Meal 1', 'Meal 2']);
    expect(JSON.stringify(res.body)).not.toMatch(/kcal|calorie/i);

    expect((await mark(today, { protein: 0.3 })).status).toBe(400);
    expect((await api.request('PUT', `/meal-logs/${today}`, { token: trainee.token, body: {} })).status).toBe(400);

    // Back to nothing = no log at all.
    await mark(today, { protein: 0, carb: 0, fat: 0, snack: 0 });
    expect(await MealLog.countDocuments()).toBe(0);
  });

  it('snack portions are tracked like any group; a log saved before snacks existed reads as 0', async () => {
    await publishPlan(1);
    await NutritionPlanVersion.updateOne({ version: 1 }, { $set: { 'meals.0.portions.snack': 1 } });
    const res = await mark(today, { protein: 1, snack: 1 });
    expect(res.body.day).toMatchObject({ planned: { protein: 1, carb: 1, fat: 1, snack: 1 }, eaten: { protein: 1, carb: 0, fat: 0, snack: 1 } });
    // A day stored before 13a+ snacks (no snack fields).
    await MealLog.collection.updateOne({ date: today }, { $unset: { 'eaten.snack': '', 'planned.snack': '' } });
    const day = (await days()).days.find((candidate) => candidate.date === today)!;
    expect(day.eaten).toEqual({ protein: 1, carb: 0, fat: 0, snack: 0 });
  });

  it('only today and the 6 days before can be changed', async () => {
    await publishPlan(1);
    await NutritionPlanVersion.updateMany({}, { $set: { publishedAt: new Date(Date.now() - 30 * DAY_MS) } });
    expect((await mark(addDays(today, -6), { protein: 1 })).status).toBe(200);
    expect((await mark(addDays(today, -7), { protein: 1 })).status).toBe(400);
    expect((await mark(addDays(today, 1), { protein: 1 })).status).toBe(400);
    expect((await mark('2026-13-01', { protein: 1 })).status).toBe(400);
  });

  it('a past day uses the version live that day and keeps its snapshot when the plan changes', async () => {
    await publishPlan(1);
    // Version 1 has been live for 10 days.
    await NutritionPlanVersion.updateOne({ version: 1 }, { $set: { publishedAt: new Date(Date.now() - 10 * DAY_MS) } });
    const yesterday = addDays(today, -1);
    expect((await mark(yesterday, { protein: 1, carb: 1 })).body.day.planned).toEqual({ protein: 1, carb: 1, fat: 1, snack: 0 });

    // Version 2 (today): more protein.
    await publishPlan(1, 2);
    const window = await days();
    const byDate = new Map(window.days.map((day) => [day.date, day]));
    expect(byDate.get(yesterday)).toMatchObject({ planned: { protein: 1, carb: 1, fat: 1, snack: 0 }, eaten: { protein: 1, carb: 1, fat: 0, snack: 0 }, planVersion: 1 });
    expect(byDate.get(addDays(today, -2))).toMatchObject({ planned: { protein: 1, carb: 1, fat: 1, snack: 0 }, logged: false, planVersion: 1 });
    expect(byDate.get(today)).toMatchObject({ planned: { protein: 3, carb: 1, fat: 1, snack: 0 }, planVersion: 2 });
    // Correcting yesterday keeps its own plan.
    expect((await mark(yesterday, { protein: 3 })).body.day).toMatchObject({ planned: { protein: 1, carb: 1, fat: 1, snack: 0 }, eaten: { protein: 1 } });
  });

  it('a meal photo per meal per day: private, replaced and removed (the old one deleted)', async () => {
    await publishPlan(2);
    const [breakfast] = (await days()).days.at(-1)!.meals;

    const first = await uploadPhoto(today, breakfast.id);
    expect(first.status).toBe(200);
    expect(first.body.day.photos).toEqual([
      expect.objectContaining({ mealId: breakfast.id, mealName: 'Meal 1', url: expect.stringContaining('sistem/meal-photos/') }),
    ]);
    expect(storage.upload.mock.calls[0][1]).toBe(`sistem/meal-photos/${trainee.id}`);
    expect(first.body.day.eaten).toEqual({ protein: 0, carb: 0, fat: 0, snack: 0 });

    const replaced = await uploadPhoto(today, breakfast.id);
    expect(replaced.body.day.photos).toHaveLength(1);
    expect(storage.remove).toHaveBeenCalledTimes(1);

    // A photo keeps the day even with nothing marked.
    await mark(today, { protein: 0 });
    expect(await MealLog.countDocuments()).toBe(1);

    expect((await uploadPhoto(today, '0123456789abcdef01234567')).status).toBe(400);
    expect((await uploadPhoto(today, breakfast.id, Buffer.from('not an image'))).status).toBe(400);

    const removed = await api.request('DELETE', `/meal-logs/${today}/photos/${breakfast.id}`, { token: trainee.token });
    expect(removed.body.day.photos).toEqual([]);
    expect(storage.remove).toHaveBeenCalledTimes(2);
    expect(await MealLog.countDocuments()).toBe(0);
  });

  it('the coach reads her week (Sunday → Saturday) read-only; nobody else can', async () => {
    await publishPlan(2);
    await NutritionPlanVersion.updateMany({}, { $set: { publishedAt: new Date(Date.now() - 10 * DAY_MS) } });
    await mark(today, { protein: 1, carb: 2 });
    const path = `/coach/trainees/${trainee.id}/meal-logs`;

    const res = await api.request('GET', path, { token: coach.token });
    expect(res.status).toBe(200);
    expect(res.body.weekStart).toBe(weekStartOf(today));
    expect(res.body.days).toHaveLength(7);
    const todayRow = res.body.days.find((day: { date: string }) => day.date === today);
    expect(todayRow).toMatchObject({ planned: { protein: 2, carb: 2, fat: 2, snack: 0 }, eaten: { protein: 1, carb: 2, fat: 0, snack: 0 }, logged: true });
    const pastDays = res.body.days.filter((day: { date: string }) => day.date <= today).length;
    expect(res.body.totals).toEqual({ planned: { protein: 2 * pastDays, carb: 2 * pastDays, fat: 2 * pastDays, snack: 0 }, eaten: { protein: 1, carb: 2, fat: 0, snack: 0 } });

    const lastWeek = await api.request('GET', `${path}?weekStart=${addDays(weekStartOf(today), -7)}`, { token: coach.token });
    expect(lastWeek.body.days[0].date).toBe(addDays(weekStartOf(today), -7));
    expect((await api.request('GET', `${path}?weekStart=${addDays(weekStartOf(today), 1)}`, { token: coach.token })).status).toBe(400);

    expect((await api.request('GET', path, { token: otherCoach.token })).status).toBe(404);
    expect((await api.request('GET', path, { token: trainee.token })).status).toBe(403);
    expect((await api.request('GET', '/meal-logs', { token: coach.token })).status).toBe(403);
  });
});
