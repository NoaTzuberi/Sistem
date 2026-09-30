import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../exercises/__tests__/testDb';
import { User } from '../../users/user.model';
import { register } from '../auth.controller';
import { getCurrentUser, loginUser } from '../auth.service';
import { resolveAppState } from '../../users/appState.service';
import { requireRole } from '../../../middleware/auth.middleware';
import type { AuthenticatedRequest } from '../../../middleware/auth.middleware';
import { describeDatabaseUrl } from '../../users/scripts/promoteCoach';

const PASSWORD = 'password123';

function mockResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

async function registerViaController(body: Record<string, unknown>) {
  const res = mockResponse();
  await register({ body } as Request, res as unknown as Response);
  return res;
}

async function runRequireRole(userId: string | undefined) {
  const res = mockResponse();
  const next = vi.fn() as unknown as NextFunction;
  await requireRole('coach')({ userId } as AuthenticatedRequest, res as unknown as Response, next);
  return { res, next };
}

describe('roles and app state', () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('sign-up always creates a trainee, even when the body asks for coach', async () => {
    const res = await registerViaController({
      name: 'Sneaky',
      email: 'sneaky@example.com',
      password: PASSWORD,
      role: 'coach',
    });

    expect(res.statusCode).toBe(201);
    const stored = await User.findOne({ email: 'sneaky@example.com' });
    expect(stored?.role).toBe('trainee');
    expect((res.body as { user: { role: string } }).user.role).toBe('trainee');
  });

  it('a new trainee resolves to the onboarding state', async () => {
    const res = await registerViaController({ name: 'New', email: 'new@example.com', password: PASSWORD });
    const { user } = res.body as { user: { appState: string; onboardingCompleted: boolean } };
    expect(user.onboardingCompleted).toBe(false);
    expect(user.appState).toBe('onboarding');
  });

  it('an onboarded trainee without a published plan resolves to waiting', async () => {
    await registerViaController({ name: 'Done', email: 'done@example.com', password: PASSWORD });
    const stored = await User.findOneAndUpdate({ email: 'done@example.com' }, { onboardingCompleted: true }, { new: true });

    const user = await getCurrentUser(String(stored!._id));
    expect(user.appState).toBe('waiting');
  });

  it('a coach resolves to the coach state on login', async () => {
    await registerViaController({ name: 'Coach', email: 'coach@example.com', password: PASSWORD });
    await User.updateOne({ email: 'coach@example.com' }, { role: 'coach' });

    const { user } = await loginUser('coach@example.com', PASSWORD);
    expect(user.role).toBe('coach');
    expect(user.appState).toBe('coach');
  });

  it('resolveAppState follows the PRD §4.2 table', () => {
    expect(resolveAppState({ role: 'trainee', onboardingCompleted: false }, false)).toBe('onboarding');
    expect(resolveAppState({ role: 'trainee', onboardingCompleted: false }, true)).toBe('onboarding');
    expect(resolveAppState({ role: 'trainee', onboardingCompleted: true }, false)).toBe('waiting');
    expect(resolveAppState({ role: 'trainee', onboardingCompleted: true }, true)).toBe('home');
    expect(resolveAppState({ role: 'coach', onboardingCompleted: false }, false)).toBe('coach');
  });

  describe('requireRole', () => {
    it('returns 401 without an authenticated user', async () => {
      const { res, next } = await runRequireRole(undefined);
      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when the user no longer exists', async () => {
      const { res, next } = await runRequireRole('64b000000000000000000000');
      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 for a trainee on a coach route', async () => {
      await registerViaController({ name: 'T', email: 't@example.com', password: PASSWORD });
      const trainee = await User.findOne({ email: 't@example.com' });

      const { res, next } = await runRequireRole(String(trainee!._id));
      expect(res.statusCode).toBe(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('lets a coach through', async () => {
      await registerViaController({ name: 'C', email: 'c@example.com', password: PASSWORD });
      const coach = await User.findOneAndUpdate({ email: 'c@example.com' }, { role: 'coach' }, { new: true });

      const { next } = await runRequireRole(String(coach!._id));
      expect(next).toHaveBeenCalledOnce();
    });
  });
});

describe('promote:coach database guard', () => {
  it('treats localhost as local', () => {
    expect(describeDatabaseUrl('mongodb://localhost:27017/sistem')).toEqual({
      hosts: ['localhost'],
      databaseName: 'sistem',
      isLocal: true,
    });
  });

  it('treats Atlas / remote hosts as non-local and never exposes credentials', () => {
    const target = describeDatabaseUrl('mongodb+srv://user:secret@cluster0.example.mongodb.net/sistem?retryWrites=true');
    expect(target.isLocal).toBe(false);
    expect(target.hosts).toEqual(['cluster0.example.mongodb.net']);
    expect(target.databaseName).toBe('sistem');
    expect(JSON.stringify(target)).not.toContain('secret');
  });
});
