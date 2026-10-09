import type { Language } from '@sistem/types';
import { User } from './user.model';
import { resolveLanguage } from './units';

/**
 * A user's language for texts built outside a request (Phase 15): AI drafts for the coach,
 * email, Phase 5b push. Hebrew when unknown.
 */
export async function getUserLanguage(userId: string): Promise<Language> {
  const user = await User.findById(userId).select('preferences').lean();
  return resolveLanguage(user?.preferences);
}
