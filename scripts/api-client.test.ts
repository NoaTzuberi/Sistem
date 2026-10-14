import { describe, expect, it } from 'vitest';
import { createApiClient } from '../packages/api-client/src/createApiClient';

// Sign-up answered 404 when the mobile app's .env had no VITE_API_URL: the call went to
// the page's origin as '/auth/register' instead of '<server>/api/auth/register'.

const options = { getToken: () => null, onUnauthorized: () => {} };

describe('createApiClient base URL', () => {
  it('sends sign-up under the configured base URL', () => {
    const absolute = createApiClient({ ...options, baseURL: 'http://localhost:5002/api' });
    expect(absolute.getUri({ url: '/auth/register' })).toBe('http://localhost:5002/api/auth/register');

    // `npm run dev:phone` uses the relative form behind the Vite proxy.
    const relative = createApiClient({ ...options, baseURL: '/api' });
    expect(relative.getUri({ url: '/auth/register' })).toBe('/api/auth/register');
  });

  it('refuses to start without a base URL', () => {
    for (const baseURL of [undefined, '', '   ']) {
      expect(() => createApiClient({ ...options, baseURL: baseURL as string })).toThrow(/VITE_API_URL/);
    }
  });
});
