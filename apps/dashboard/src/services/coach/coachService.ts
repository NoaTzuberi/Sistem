import { createCoachApi } from '@sistem/api-client';
import { apiClient } from '../api/apiClient';

export const {
  listTrainees,
  getTrainee,
  listTraineeWorkoutLogs,
  listTraineeBodyMetrics,
  searchExercises,
  listPlans,
  listPlanWeeks,
  getPlan,
  createPlan,
  savePlan,
  publishPlan,
  unpublishPlan,
  deletePlan,
} = createCoachApi(apiClient);
