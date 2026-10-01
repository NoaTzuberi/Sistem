import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { getMyBodyMetrics } from './bodyMetric.controller';

// Read-only for now; logging weight, measurements and photos arrives in Phase 10.
export const bodyMetricsRouter = Router();

bodyMetricsRouter.use(requireAuth);

bodyMetricsRouter.get('/', getMyBodyMetrics);
