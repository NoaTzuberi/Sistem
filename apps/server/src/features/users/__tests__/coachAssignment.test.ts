import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../exercises/__tests__/testDb';
import { startApiTestClient, createTestUser } from '../../../testing/apiTestClient';
import type { ApiTestClient } from '../../../testing/apiTestClient';
import { config } from '../../../config/env';
import { User } from '../user.model';
import { assignUnassignedTrainees, resolveDefaultCoachId } from '../coachAssignment.service';
import { isValidTimezone } from '../timezone';

let api: ApiTestClient;

async function signUp(email: string, extra: Record<string, unknown> = {}) {
  return api.request('POST', '/auth/register', { body: { name: 'New', email, password: 'password123', ...extra } });
}

describe('coach assignment and time zone on sign-up', () => {
  const originalDefaultCoachEmail = config.defaultCoachEmail;

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
  });

  afterEach(() => {
    config.defaultCoachEmail = originalDefaultCoachEmail;
  });

  it('uses DEFAULT_COACH_EMAIL when it names a coach', async () => {
    await createTestUser('other@example.com', { role: 'coach' });
    const chosen = await createTestUser('chosen@example.com', { role: 'coach' });
    config.defaultCoachEmail = 'chosen@example.com';

    await signUp('t1@example.com');
    const trainee = await User.findOne({ email: 't1@example.com' }).lean();
    expect(String(trainee?.coachId)).toBe(chosen.id);
  });

  it('falls back to the only coach when DEFAULT_COACH_EMAIL is unset or wrong', async () => {
    const onlyCoach = await createTestUser('only@example.com', { role: 'coach' });
    config.defaultCoachEmail = '';
    expect(String(await resolveDefaultCoachId())).toBe(onlyCoach.id);
    config.defaultCoachEmail = 'missing@example.com';
    expect(String(await resolveDefaultCoachId())).toBe(onlyCoach.id);
  });

  it('never guesses between several coaches', async () => {
    config.defaultCoachEmail = '';
    await createTestUser('one@example.com', { role: 'coach' });
    await createTestUser('two@example.com', { role: 'coach' });
    expect(await resolveDefaultCoachId()).toBeNull();
  });

  it('signs up without a coach when none exists, and assigns later', async () => {
    config.defaultCoachEmail = '';
    const res = await signUp('early@example.com');
    expect(res.status).toBe(201);
    expect((await User.findOne({ email: 'early@example.com' }).lean())?.coachId).toBeNull();

    const coach = await createTestUser('late@example.com', { role: 'coach' });
    expect(await assignUnassignedTrainees(coach.user._id)).toBe(1);
    expect(String((await User.findOne({ email: 'early@example.com' }).lean())?.coachId)).toBe(coach.id);
  });

  it('stores the device time zone, and falls back to Asia/Jerusalem for a missing or unknown one', async () => {
    const withZone = await signUp('ny@example.com', { timezone: 'America/New_York' });
    expect(withZone.body.user.timezone).toBe('America/New_York');

    const without = await signUp('default@example.com');
    expect(without.body.user.timezone).toBe('Asia/Jerusalem');

    const unknown = await signUp('unknown@example.com', { timezone: 'Mars/Olympus' });
    expect(unknown.status).toBe(201);
    expect(unknown.body.user.timezone).toBe('Asia/Jerusalem');
  });

  it('rejects a non-string time zone', async () => {
    expect((await signUp('bad@example.com', { timezone: 3 })).status).toBe(400);
  });

  it('never exposes push tokens', async () => {
    await createTestUser('push@example.com', { pushTokens: [{ token: 'secret-device-token', platform: 'ios', updatedAt: new Date() }] });
    const user = await User.findOne({ email: 'push@example.com' }).lean();
    expect(user?.pushTokens).toBeUndefined();
  });

  it('validates IANA zones', () => {
    expect(isValidTimezone('Asia/Jerusalem')).toBe(true);
    expect(isValidTimezone('Nowhere/City')).toBe(false);
    expect(isValidTimezone('')).toBe(false);
  });
});
