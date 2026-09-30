import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { listMyPersonalRecords } from './personalRecord.controller';

export const personalRecordsRouter = Router();

personalRecordsRouter.use(requireAuth);

personalRecordsRouter.get('/', listMyPersonalRecords);
