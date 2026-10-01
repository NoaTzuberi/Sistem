import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getUserProfileById, UserNotFoundError } from './users.service';

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await getUserProfileById(req.userId!);
    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(401).json({ message: error.message });
      return;
    }
    throw error;
  }
}
