import { createApiClient } from '@sistem/api-client';
import { getToken, clearToken } from '../auth/tokenStorage';
import { ROUTES } from '../../app/config/routes';

export const apiClient = createApiClient({
  baseURL: import.meta.env.VITE_API_URL,
  getToken,
  // A 401 outside the public auth endpoints means the stored token expired or is
  // invalid. A full reload to /login resets all in-memory state (R3: revisit this
  // for Capacitor in Phase 5).
  onUnauthorized: () => {
    clearToken();
    if (!window.location.pathname.startsWith(ROUTES.LOGIN)) {
      window.location.href = ROUTES.LOGIN;
    }
  },
});
