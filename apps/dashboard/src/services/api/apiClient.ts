import { createApiClient } from '@sistem/api-client';
import { getActiveLanguage } from '@sistem/shared';
import { getToken, clearToken } from '../auth/tokenStorage';
import { ROUTES } from '../../app/config/routes';

export const apiClient = createApiClient({
  baseURL: import.meta.env.VITE_API_URL,
  getToken,
  // Server messages come back in the language on screen (Phase 15).
  getLanguage: getActiveLanguage,
  onUnauthorized: () => {
    clearToken();
    if (!window.location.pathname.startsWith(ROUTES.LOGIN)) {
      window.location.href = ROUTES.LOGIN;
    }
  },
});
