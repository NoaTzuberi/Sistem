import { aiUnavailableReason } from './ai.config';
import { translate } from '../../i18n';
import { generateGeminiJson } from './gemini.provider';
import { AiProviderError } from './ai.types';
import type { AiJsonRequest, AiJsonResponse } from './ai.types';

// THE way the app talks to an AI model. Everything provider-specific (Gemini today)
// sits behind it, so moving to a paid provider changes only the import below.
// An object (not a bare function) so tests can replace the model with a fake.

export const aiClient = {
  /** A JSON reply that follows `schema`. Throws AiProviderError when no model could answer. */
  async generateJson(request: AiJsonRequest): Promise<AiJsonResponse> {
    const unavailable = aiUnavailableReason();
    if (unavailable) throw new AiProviderError('not_configured', translate('en', unavailable));
    return generateGeminiJson(request);
  },
};
