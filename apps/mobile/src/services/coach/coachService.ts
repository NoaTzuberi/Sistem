import { createCoachApi } from '@sistem/api-client';
import { apiClient } from '../api/apiClient';

// Coach mode only reads, and publishes / duplicates plans (PRD §6): plan editing
// stays on the web dashboard, so the other coach calls are not exposed here.
export const {
  listTrainees,
  getTrainee,
  listTraineeWorkoutLogs,
  listTraineeBodyMetrics,
  listPlans,
  createPlan,
  publishPlan,
} = createCoachApi(apiClient);
