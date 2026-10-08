import { createTraineeApi } from '@sistem/api-client';
import { apiClient } from '../api/apiClient';

// The trainee's newest published nutrition plan (no calorie numbers) and the tab-bar
// dots (Phase 13a). The server scopes every call to the signed-in trainee.
export const { getNutritionPlan, getTabUpdates, markTabSeen } = createTraineeApi(apiClient);
