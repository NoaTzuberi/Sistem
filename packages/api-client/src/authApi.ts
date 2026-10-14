import type { AxiosInstance } from 'axios';
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload, UpdatePreferencesPayload } from '@sistem/types';
import { extractErrorMessage } from './createApiClient';

// Auth calls shared by the mobile app and the coach dashboard. Errors are rethrown
// as plain Error with the server's message (in the language on screen), so pages can show
// it directly; the message is '' when the server never answered — pages then show their
// own text.
export function createAuthApi(client: AxiosInstance) {
  async function register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const { data } = await client.post<AuthResponse>('/auth/register', payload);
      return data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, ''));
    }
  }

  async function login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const { data } = await client.post<AuthResponse>('/auth/login', payload);
      return data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, ''));
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
      throw new Error(extractErrorMessage(error, ''));
    }
  }

  async function resetPassword(token: string, password: string, confirmPassword?: string): Promise<string> {
    try {
      const { data } = await client.post<{ message: string }>('/auth/reset-password', { token, password, confirmPassword });
      return data.message;
    } catch (error) {
      throw new Error(extractErrorMessage(error, ''));
    }
  }

  /** Her display units and / or UI language (Settings, both apps); answers the updated user. */
  async function updatePreferences(payload: UpdatePreferencesPayload): Promise<AuthUser> {
    const { data } = await client.patch<{ user: AuthUser }>('/users/preferences', payload);
    return data.user;
  }

  return { register, login, fetchCurrentUser, requestPasswordReset, resetPassword, updatePreferences };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
