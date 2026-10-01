import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../features/users/user.model';
import type { AuthenticatedRequest } from './auth.middleware';

/**
 * Use after requireAuth + requireRole('coach') on routes with :traineeId. Lets the
 * request through only for a trainee assigned to the calling coach. A trainee of
 * another coach gets the same 404 as a missing one, so ids can't be probed.
 */
export async function loadCoachTrainee(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { traineeId } = req.params;
  if (typeof traineeId !== 'string' || !mongoose.isValidObjectId(traineeId)) {
    res.status(400).json({ message: 'Invalid trainee id.' });
    return;
  }

  const trainee = await User.exists({ _id: traineeId, role: 'trainee', coachId: req.userId });
  if (!trainee) {
    res.status(404).json({ message: 'Trainee not found.' });
    return;
  }

  req.traineeId = traineeId;
  next();
}
