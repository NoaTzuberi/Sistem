import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from './workoutTemplate.controller';

export const workoutTemplatesRouter = Router();

workoutTemplatesRouter.use(requireAuth);

workoutTemplatesRouter.get('/', listTemplates);
workoutTemplatesRouter.get('/:id', getTemplateById);
workoutTemplatesRouter.post('/', createTemplate);
workoutTemplatesRouter.patch('/:id', updateTemplate);
workoutTemplatesRouter.delete('/:id', deleteTemplate);
