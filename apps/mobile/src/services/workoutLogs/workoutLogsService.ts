import { createTraineeApi } from '@sistem/api-client';
import { apiClient } from '../api/apiClient';

// The trainee's workout logs, the active session (Phase 8) and the summary + Daily Pump
// photo (Phase 9). The server owns the log: it pre-fills the sets, stamps the times
// and computes the stats and PRs.
export const {
  listWorkoutLogs,
  getWorkoutLog,
  startWorkout,
  getActiveSession,
  getSession,
  updateWorkoutSets,
  finishWorkout,
  abandonWorkout,
  updateWorkoutSummary,
  uploadPumpPhoto,
  removePumpPhoto,
} = createTraineeApi(apiClient);
