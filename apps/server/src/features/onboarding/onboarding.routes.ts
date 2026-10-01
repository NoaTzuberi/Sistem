import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { getOnboarding, patchOnboardingStep, postCompleteOnboarding } from './onboarding.controller';

// Always the caller's own questionnaire — there is no id in the path to tamper with.
export const onboardingRouter = Router();

onboardingRouter.use(requireAuth, requireRole('trainee'));

onboardingRouter.get('/', getOnboarding);
onboardingRouter.patch('/', patchOnboardingStep);
onboardingRouter.post('/complete', postCompleteOnboarding);
