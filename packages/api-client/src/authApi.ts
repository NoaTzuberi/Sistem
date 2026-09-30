import type { AxiosInstance } from 'axios';
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from '@sistem/types';
import { extractErrorMessage } from './createApiClient';

// Auth calls shared by the mobile app and the coach dashboard. Errors are rethrown
// as plain Error with the server's message, so pages can show it directly.
export function createAuthApi(client: AxiosInstance) {
  async function register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const { data } = await client.post<AuthResponse>('/auth/register', payload);
      return data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Registration failed. Please try again.'));
    }
  }

  async function login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const { data } = await client.post<AuthResponse>('/auth/login', payload);
      return data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Login failed. Please try again.'));
    }
  }

  async function fetchCurrentUser(): Promise<AuthUser> {
    const { data } = await client.get<{ user: AuthUser }>('/auth/me');
    return data.user;
  }

  async function requestPasswordReset(email: string): Promise<string> {
    try {
      const { data } = await client.post<{ message: string }>('/auth/forgot-password', { email });
      return data.message;
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Couldn't send the reset email. Please try again."));
    }
  }

  async function resetPassword(token: string, password: string): Promise<string> {
    try {
      const { data } = await client.post<{ message: string }>('/auth/reset-password', { token, password });
      return data.message;
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Couldn't reset your password. Please try again."));
    }
  }

  return { register, login, fetchCurrentUser, requestPasswordReset, resetPassword };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
