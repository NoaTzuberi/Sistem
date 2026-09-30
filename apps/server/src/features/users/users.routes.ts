import { Router } from 'express';
import { getProfile, updateProfile } from './users.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const usersRouter = Router();

usersRouter.get('/profile', requireAuth, getProfile);
usersRouter.put('/profile', requireAuth, updateProfile);
