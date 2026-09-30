import { createAuthApi } from '@sistem/api-client';
import { apiClient } from '../api/apiClient';

export const { login, fetchCurrentUser } = createAuthApi(apiClient);
