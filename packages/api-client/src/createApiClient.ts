import axios from 'axios';
import type { AxiosInstance } from 'axios';

export interface ApiClientOptions {
  baseURL: string;
  getToken: () => string | null;
  /**
   * Called when a request that needed a session gets a 401 (expired/invalid token).
   * Each app decides what that means — a browser redirect, a router navigation,
   * or later a Capacitor-safe logout — so the package never touches `window`.
   */
  onUnauthorized: () => void;
}

// Endpoints where a 401 means "wrong credentials", not "your session expired" —
// they must never trigger onUnauthorized.
const PUBLIC_AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

export function createApiClient({ baseURL, getToken, onUnauthorized }: ApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use((requestConfig) => {
    const token = getToken();
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const url = error.config?.url ?? '';
        const isPublicAuthCall = PUBLIC_AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
        if (!isPublicAuthCall) {
          onUnauthorized();
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
}
