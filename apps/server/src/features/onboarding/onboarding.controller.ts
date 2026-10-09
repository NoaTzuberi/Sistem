import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validateCompleteOnboardingPayload, validateOnboardingStepPayload } from './onboarding.validation';
import {
  getMyOnboarding,
  getWaitingStatus,
  saveOnboardingStep,
  completeOnboarding,
  getStoredWeightUnit,
  OnboardingUserNotFoundError,
} from './onboarding.service';
import { sendError } from '../../i18n';

function handleUserNotFound(error: unknown, res: Response): boolean {
  if (error instanceof OnboardingUserNotFoundError) {
    sendError(res, 401, error.serverMessage);
    return true;
  }
  return false;
}

export async function getOnboarding(req: AuthenticatedRequest, res: Response) {
  try {
    const onboarding = await getMyOnboarding(req.userId!);
    res.status(200).json({ onboarding });
  } catch (error) {
    if (!handleUserNotFound(error, res)) throw error;
  }
}

export async function getWaiting(req: AuthenticatedRequest, res: Response) {
  try {
    res.status(200).json(await getWaitingStatus(req.userId!));
  } catch (error) {
    if (!handleUserNotFound(error, res)) throw error;
  }
}

export async function patchOnboardingStep(req: AuthenticatedRequest, res: Response) {
  const validationError = validateOnboardingStepPayload(req.body, await getStoredWeightUnit(req.userId!));
  if (validationError) {
    sendError(res, 400, validationError);
    return;
  }

  try {
    const result = await saveOnboardingStep(req.userId!, req.body.step, req.body.answers ?? {});
    res.status(200).json(result);
  } catch (error) {
    if (!handleUserNotFound(error, res)) throw error;
  }
}

export async function postCompleteOnboarding(req: AuthenticatedRequest, res: Response) {
  const validationError = validateCompleteOnboardingPayload(req.body, await getStoredWeightUnit(req.userId!));
  if (validationError) {
    sendError(res, 400, validationError);
    return;
  }

  try {
    const result = await completeOnboarding(req.userId!, req.body);
    res.status(200).json(result);
  } catch (error) {
    if (!handleUserNotFound(error, res)) throw error;
  }
}
