import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../features/exercises/__tests__/testDb';
import { startApiTestClient, createTestUser } from '../../testing/apiTestClient';
import type { ApiTestClient } from '../../testing/apiTestClient';
import { translate, msg } from '..';

// Phase 15: the UI language is stored per user; every error is a stable code + a message in the
// request's language (Hebrew unless the client asks for English).

let api: ApiTestClient;

describe('language (Phase 15)', () => {
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

  it('is Hebrew by default and changes in Settings, alone or with the units', async () => {
    const trainee = await createTestUser('noa@example.com');
    const me = await api.request('GET', '/auth/me', { token: trainee.token });
    expect(me.body.user.language).toBe('he');

    const changed = await api.request('PATCH', '/users/preferences', { token: trainee.token, body: { language: 'en' } });
    expect(changed.status).toBe(200);
    expect(changed.body.user.language).toBe('en');
    expect(changed.body.user.units).toEqual({ weight: 'kg', length: 'cm' });

    const both = await api.request('PATCH', '/users/preferences', { token: trainee.token, body: { language: 'he', units: { weight: 'lb' } } });
    expect(both.body.user).toMatchObject({ language: 'he', units: { weight: 'lb', length: 'cm' } });
  });

  it('refuses an unknown language or field with a code', async () => {
    const trainee = await createTestUser('noa@example.com');
    const bad = await api.request('PATCH', '/users/preferences', { token: trainee.token, body: { language: 'fr' } });
    expect(bad.status).toBe(400);
    expect(bad.body.code).toBe('language_invalid');
    const empty = await api.request('PATCH', '/users/preferences', { token: trainee.token, body: {} });
    expect(empty.body.code).toBe('preferences_empty');
  });

  it('keeps the language she signed up in', async () => {
    const res = await api.request('POST', '/auth/register', {
      body: { name: 'Dana', email: 'dana@example.com', password: 'a-long-password', language: 'en' },
    });
    expect(res.status).toBe(201);
    expect(res.body.user.language).toBe('en');
  });

  it('answers errors in the request language: Hebrew by default, English when asked', async () => {
    const hebrew = await api.request('POST', '/auth/login', { body: { email: 'nobody@example.com', password: 'whatever' }, language: null });
    expect(hebrew.status).toBe(401);
    expect(hebrew.body).toEqual({ code: 'invalid_credentials', message: 'אימייל או סיסמה שגויים.' });

    const english = await api.request('POST', '/auth/login', { body: { email: 'nobody@example.com', password: 'whatever' }, language: 'en' });
    expect(english.body).toEqual({ code: 'invalid_credentials', message: 'Invalid email or password.' });
  });

  it('words nested params and lists in the same language', () => {
    const message = msg('ai_calculation_missing', { fields: [msg('ai_field_weight'), msg('ai_field_height')] });
    expect(translate('en', message)).toContain('missing her weight, height.');
    expect(translate('he', message)).toContain('משקל, גובה');
  });
});
