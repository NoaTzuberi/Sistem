import { createTraineeApi } from '@sistem/api-client';
import { apiClient } from '../api/apiClient';

// The trainee's own published plans; statuses are computed on the server.
export const { getWeek, listPlans, getPlan } = createTraineeApi(apiClient);
