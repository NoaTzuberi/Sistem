import { createCoachApi } from '@sistem/api-client';
import { apiClient } from '../api/apiClient';

// Coach mode only reads, and publishes / duplicates plans (PRD §6): plan editing
// stays on the web dashboard, so the other coach calls are not exposed here. Nutrition
// (Phase 13a) and portion tracking (13a+) are read-only here too.
export const {
  listTrainees,
  getTrainee,
  listTraineeWorkoutLogs,
  listTraineeBodyMetrics,
  getTraineeAchievements,
  listPlans,
  createPlan,
  publishPlan,
  getNutritionPlan,
  getTraineeMealLogs,
} = createCoachApi(apiClient);
