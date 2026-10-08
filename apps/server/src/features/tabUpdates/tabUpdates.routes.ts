import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { getMyTabUpdates, postTabSeen } from './tabUpdates.controller';

// The trainee's own tab dots only.
export const tabUpdatesRouter = Router();

tabUpdatesRouter.use(requireAuth, requireRole('trainee'));

tabUpdatesRouter.get('/', getMyTabUpdates);
tabUpdatesRouter.post('/seen', postTabSeen);
