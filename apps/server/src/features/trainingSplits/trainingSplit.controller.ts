import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { sendError } from '../../i18n';
import { getEffectiveTrainingConfig, mergeTrainingConfig, saveTrainingSettings } from './trainingSplit.service';
import { parseTrainingSettingsPayload } from './trainingSplit.validation';

/** GET /coach/training/config — the effective config and the defaults (for a later reset button). */
export async function getTrainingConfig(req: AuthenticatedRequest, res: Response) {
  res.status(200).json({ config: await getEffectiveTrainingConfig(req.userId!), defaults: mergeTrainingConfig(null) });
}

/** PUT /coach/training/settings — replaces her overrides; answers with the effective config. */
export async function putTrainingSettings(req: AuthenticatedRequest, res: Response) {
  const { value, error } = parseTrainingSettingsPayload(req.body);
  if (error) {
    sendError(res, 400, error);
    return;
  }
  res.status(200).json({ config: await saveTrainingSettings(req.userId!, value), defaults: mergeTrainingConfig(null) });
}
