import type { AddressInfo } from 'net';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import type { Types } from 'mongoose';
import app from '../app';
import { config } from '../config/env';
import { User } from '../features/users/user.model';
import type { UserDocument } from '../features/users/user.model';

// Test helper: runs the real Express app (every middleware and route) on a random
// port and calls it with Node's built-in fetch — no extra test dependency.

interface RequestOptions {
  token?: string;
  body?: unknown;
  /** A raw body (e.g. a photo upload) instead of JSON. */
  raw?: { data: Buffer; contentType: string };
  /**
   * Accept-Language (Phase 15). Tests read English messages by default; 'he' checks the
   * Hebrew ones, null sends no header (the server's default, Hebrew).
   */
  language?: 'he' | 'en' | null;
}

export interface ApiResponse<T = any> {
  status: number;
  body: T;
}

export interface ApiTestClient {
  request<T = any>(method: string, path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  close(): Promise<void>;
}

export async function startApiTestClient(): Promise<ApiTestClient> {
  const server: Server = await new Promise((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const { port } = server.address() as AddressInfo;

  return {
    async request(method, path, { token, body, raw, language = 'en' } = {}) {
      const headers: Record<string, string> = {};
      if (language) headers['Accept-Language'] = language;
      if (token) headers.Authorization = `Bearer ${token}`;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (raw) headers['Content-Type'] = raw.contentType;
      const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {
        method,
        headers,
        body: raw ? new Uint8Array(raw.data) : body === undefined ? undefined : JSON.stringify(body),
      });
      // Express's own 404 page is HTML, not JSON.
      const isJson = response.headers.get('content-type')?.includes('application/json');
      return { status: response.status, body: isJson ? await response.json() : await response.text() };
    },
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

export function tokenFor(userId: Types.ObjectId | string): string {
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn: '1h' });
}

/** Creates a user directly (no bcrypt — these tests never log in with a password). */
export async function createTestUser(email: string, fields: Partial<UserDocument> = {}) {
  const user = await User.create({ name: email.split('@')[0], email, passwordHash: 'not-a-real-hash', ...fields });
  return { user, id: String(user._id), token: tokenFor(user._id) };
}
