import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Types } from 'mongoose';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../exercises/__tests__/testDb';
import { startApiTestClient, createTestUser } from '../../../testing/apiTestClient';
import type { ApiTestClient } from '../../../testing/apiTestClient';
import { emitAppEvent } from '../../../events/appEvents';
import { Notification } from '../notification.model';
import { notify } from '../notification.service';

const FULL_ONBOARDING = {
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

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

let api: ApiTestClient;
let coach: TestUser;
let trainee: TestUser;

function newId(): string {
  return String(new Types.ObjectId());
}

function planPublished(planId: string) {
  return { type: 'plan_published' as const, data: { planId, weekStartDate: '2026-09-27' } };
}

describe('notifications (in-app)', () => {
  beforeAll(async () => {
    await connectTestDatabase();
    api = await startApiTestClient();
    // Unique indexes must exist before the dedupe tests run.
    await Notification.init();
  });

  afterAll(async () => {
    await api.close();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    coach = await createTestUser('coach@example.com', { role: 'coach' });
    trainee = await createTestUser('maya@example.com', { coachId: coach.user._id });
  });

  describe('event hooks', () => {
    it("'trainee.onboarded' notifies the trainee's coach, once", async () => {
      await api.request('POST', '/onboarding/complete', { token: trainee.token, body: FULL_ONBOARDING });
      await api.request('POST', '/onboarding/complete', { token: trainee.token, body: FULL_ONBOARDING });

      await vi.waitFor(async () => {
        expect(await Notification.countDocuments({ userId: coach.id })).toBe(1);
      });

      const res = await api.request('GET', '/notifications', { token: coach.token });
      expect(res.status).toBe(200);
      expect(res.body.unreadCount).toBe(1);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0]).toMatchObject({
        type: 'trainee_onboarded',
        data: { traineeId: trainee.id, traineeName: 'Maya' },
        readAt: null,
      });
      // Nothing for the trainee herself.
      expect(await Notification.countDocuments({ userId: trainee.id })).toBe(0);
    });

    it('a trainee without a coach notifies nobody', async () => {
      const loner = await createTestUser('loner@example.com');
      const res = await api.request('POST', '/onboarding/complete', { token: loner.token, body: FULL_ONBOARDING });
      expect(res.status).toBe(200);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(await Notification.countDocuments({})).toBe(0);
    });

    it("'plan.published' notifies the trainee, once per plan", async () => {
      const planId = newId();
      const event = { planId, traineeId: trainee.id, coachId: coach.id, weekStartDate: '2026-09-27', publishedAt: new Date() };
      emitAppEvent('plan.published', event);
      emitAppEvent('plan.published', event);
      // Listeners write in the background: the first plan's notification must exist
      // before the second plan is published, or "newest first" below is a race.
      await vi.waitFor(async () => {
        expect(await Notification.countDocuments({ userId: trainee.id })).toBe(1);
      });
      emitAppEvent('plan.published', { ...event, planId: newId(), weekStartDate: '2026-10-04' });

      await vi.waitFor(async () => {
        expect(await Notification.countDocuments({ userId: trainee.id })).toBe(2);
      });

      const res = await api.request('GET', '/notifications', { token: trainee.token });
      expect(res.body.items.map((item: { data: { weekStartDate: string } }) => item.data.weekStartDate)).toEqual([
        '2026-10-04',
        '2026-09-27',
      ]);
      expect(res.body.items[1]).toMatchObject({ type: 'plan_published', data: { planId, weekStartDate: '2026-09-27' } });
      expect(await Notification.countDocuments({ userId: coach.id })).toBe(0);
    });
  });

  describe('notify()', () => {
    it('keeps the first notification and its read state when called again', async () => {
      const payload = planPublished(newId());
      await notify(trainee.id, payload);
      await api.request('POST', '/notifications/read-all', { token: trainee.token });
      await notify(trainee.id, payload);

      const stored = await Notification.find({ userId: trainee.id }).lean();
      expect(stored).toHaveLength(1);
      expect(stored[0].readAt).toBeInstanceOf(Date);
    });

    it('the same event for two users creates one notification each', async () => {
      const other = await createTestUser('noa@example.com');
      const payload = planPublished(newId());
      await notify(trainee.id, payload);
      await notify(other.id, payload);
      expect(await Notification.countDocuments({})).toBe(2);
    });
  });

  describe('API', () => {
    it('needs a session', async () => {
      expect((await api.request('GET', '/notifications')).status).toBe(401);
      expect((await api.request('GET', '/notifications/unread-count')).status).toBe(401);
      expect((await api.request('POST', '/notifications/read-all')).status).toBe(401);
      expect((await api.request('PATCH', `/notifications/${newId()}/read`)).status).toBe(401);
    });

    it('starts empty', async () => {
      const res = await api.request('GET', '/notifications', { token: trainee.token });
      expect(res.body).toEqual({ items: [], unreadCount: 0, nextCursor: null });
    });

    it("never shows or counts another user's notifications", async () => {
      await notify(coach.id, { type: 'trainee_onboarded', data: { traineeId: trainee.id, traineeName: 'Maya' } });

      const list = await api.request('GET', '/notifications', { token: trainee.token });
      expect(list.body.items).toEqual([]);
      const count = await api.request('GET', '/notifications/unread-count', { token: trainee.token });
      expect(count.body).toEqual({ unreadCount: 0 });
    });

    it("cannot mark another user's notification as read (404, and it stays unread)", async () => {
      await notify(coach.id, { type: 'trainee_onboarded', data: { traineeId: trainee.id, traineeName: 'Maya' } });
      const stored = (await Notification.findOne({ userId: coach.id }).lean())!;

      const res = await api.request('PATCH', `/notifications/${stored._id}/read`, { token: trainee.token });
      expect(res.status).toBe(404);
      await api.request('POST', '/notifications/read-all', { token: trainee.token });

      expect((await Notification.findById(stored._id).lean())!.readAt).toBeNull();
    });

    it('marks one as read and keeps the first read time', async () => {
      await notify(trainee.id, planPublished(newId()));
      await notify(trainee.id, planPublished(newId()));
      const [first] = (await api.request('GET', '/notifications', { token: trainee.token })).body.items;

      const res = await api.request('PATCH', `/notifications/${first.id}/read`, { token: trainee.token });
      expect(res.status).toBe(200);
      expect(res.body.notification).toMatchObject({ id: first.id });
      expect(res.body.notification.readAt).not.toBeNull();

      const again = await api.request('PATCH', `/notifications/${first.id}/read`, { token: trainee.token });
      expect(again.body.notification.readAt).toBe(res.body.notification.readAt);

      const count = await api.request('GET', '/notifications/unread-count', { token: trainee.token });
      expect(count.body).toEqual({ unreadCount: 1 });
    });

    it('rejects a malformed id and reports a missing one', async () => {
      expect((await api.request('PATCH', '/notifications/nope/read', { token: trainee.token })).status).toBe(400);
      expect((await api.request('PATCH', `/notifications/${newId()}/read`, { token: trainee.token })).status).toBe(404);
    });

    it('marks all as read', async () => {
      await notify(trainee.id, planPublished(newId()));
      await notify(trainee.id, planPublished(newId()));

      const res = await api.request('POST', '/notifications/read-all', { token: trainee.token });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ unreadCount: 0 });

      const list = await api.request('GET', '/notifications', { token: trainee.token });
      expect(list.body.unreadCount).toBe(0);
      expect(list.body.items.every((item: { readAt: string | null }) => item.readAt !== null)).toBe(true);
    });

    it('pages newest first with a cursor and filters unread', async () => {
      const planIds = [newId(), newId(), newId()];
      for (const planId of planIds) {
        await notify(trainee.id, planPublished(planId));
      }

      const page1 = await api.request('GET', '/notifications?limit=2', { token: trainee.token });
      expect(page1.body.items.map((item: { data: { planId: string } }) => item.data.planId)).toEqual([planIds[2], planIds[1]]);
      expect(page1.body.nextCursor).toBe(page1.body.items[1].id);
      expect(page1.body.unreadCount).toBe(3);

      const page2 = await api.request('GET', `/notifications?limit=2&before=${page1.body.nextCursor}`, { token: trainee.token });
      expect(page2.body.items.map((item: { data: { planId: string } }) => item.data.planId)).toEqual([planIds[0]]);
      expect(page2.body.nextCursor).toBeNull();

      await api.request('PATCH', `/notifications/${page1.body.items[0].id}/read`, { token: trainee.token });
      const unread = await api.request('GET', '/notifications?unread=true', { token: trainee.token });
      expect(unread.body.items).toHaveLength(2);
    });

    it('rejects bad query values', async () => {
      for (const query of ['limit=0', 'limit=51', 'limit=abc', 'before=nope', 'unread=maybe']) {
        const res = await api.request('GET', `/notifications?${query}`, { token: trainee.token });
        expect(res.status, query).toBe(400);
      }
    });
  });
});
