import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validateOnboardingPayload } from './users.validation';
import { updateUserProfile, getUserProfileById, UserNotFoundError } from './users.service';

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

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  const validationError = validateOnboardingPayload(req.body);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const user = await updateUserProfile(req.userId!, req.body);
    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(401).json({ message: error.message });
      return;
    }
    throw error;
  }
}
