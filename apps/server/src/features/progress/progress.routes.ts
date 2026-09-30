import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { postProgressEntry, getProgressEntries } from './progress.controller';

export const progressRouter = Router();

progressRouter.use(requireAuth);

progressRouter.post('/', postProgressEntry);
progressRouter.get('/', getProgressEntries);
