import { createTraineeApi } from '@sistem/api-client';
import { apiClient } from '../api/apiClient';

// Read-only until Phase 8 adds starting, logging and finishing a workout.
export const { listWorkoutLogs, getWorkoutLog } = createTraineeApi(apiClient);
