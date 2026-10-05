import { createTraineeApi } from '@sistem/api-client';
import { apiClient } from '../api/apiClient';

// The trainee's workout logs and the active session (Phase 8). The server owns the
// log: it pre-fills the sets, stamps the times and computes the stats.
export const {
  listWorkoutLogs,
  getWorkoutLog,
  startWorkout,
  getActiveSession,
  getSession,
  updateWorkoutSets,
  finishWorkout,
  abandonWorkout,
} = createTraineeApi(apiClient);
