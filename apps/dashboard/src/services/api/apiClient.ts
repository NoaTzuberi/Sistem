import { createApiClient } from '@sistem/api-client';
import { getToken, clearToken } from '../auth/tokenStorage';
import { ROUTES } from '../../app/config/routes';

export const apiClient = createApiClient({
  baseURL: import.meta.env.VITE_API_URL,
  getToken,
  onUnauthorized: () => {
    clearToken();
    if (!window.location.pathname.startsWith(ROUTES.LOGIN)) {
      window.location.href = ROUTES.LOGIN;
    }
  },
});
