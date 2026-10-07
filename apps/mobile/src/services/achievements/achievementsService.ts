import { createTraineeApi } from '@sistem/api-client';
import { apiClient } from '../api/apiClient';

// Her achievements and weekly streak (Phase 11). The server awards them after each
// workout finish, Daily Pump upload and body save; the phone only shows them and says
// when a celebration was shown.
export const { getAchievements, markAchievementsSeen } = createTraineeApi(apiClient);
