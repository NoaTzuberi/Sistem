import { createTraineeApi } from '@sistem/api-client';
import { apiClient } from '../api/apiClient';

// Her body tracking (Phase 10): weight, measurements and progress photos, one day per
// date. Values travel in kg / cm; the screens convert to her units.
export const { listBodyMetrics, saveBodyMetric, deleteBodyMetricDay, uploadProgressPhoto, removeProgressPhoto } =
  createTraineeApi(apiClient);
