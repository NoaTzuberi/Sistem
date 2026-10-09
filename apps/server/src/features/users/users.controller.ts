import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getUserProfileById, updateUserPreferences, UserNotFoundError } from './users.service';
import { parsePreferencesPayload } from './users.validation';
import { sendError } from '../../i18n';

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await getUserProfileById(req.userId!);
    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      sendError(res, 401, error.serverMessage);
      return;
    }
    throw error;
  }
}

export async function patchPreferences(req: AuthenticatedRequest, res: Response) {
  const parsed = parsePreferencesPayload(req.body);
  if (parsed.error !== undefined) {
    sendError(res, 400, parsed.error);
    return;
  }
  try {
    res.status(200).json({ user: await updateUserPreferences(req.userId!, parsed.value) });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      sendError(res, 401, error.serverMessage);
      return;
    }
    throw error;
  }
}
