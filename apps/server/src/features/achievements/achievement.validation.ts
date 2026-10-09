import { Types } from 'mongoose';
import { msg, type ServerMessage } from '../../i18n';

const MAX_SEEN_IDS = 100;

/** Body of POST /achievements/seen: { ids: string[] } of valid ids. */
export function parseMarkSeenPayload(body: unknown): { value: string[]; error?: undefined } | { error: ServerMessage } {
  const ids = (body as { ids?: unknown } | null)?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_SEEN_IDS) {
    return { error: msg('achievements_seen_ids_invalid', { max: MAX_SEEN_IDS }) };
  }
  if (!ids.every((id) => typeof id === 'string' && Types.ObjectId.isValid(id))) {
    return { error: msg('achievements_seen_ids_unknown') };
  }
  return { value: [...new Set(ids as string[])] };
}
