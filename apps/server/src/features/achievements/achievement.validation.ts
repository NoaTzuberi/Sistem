import { Types } from 'mongoose';

const MAX_SEEN_IDS = 100;

/** Body of POST /achievements/seen: { ids: string[] } of valid ids. */
export function parseMarkSeenPayload(body: unknown): { value: string[]; error?: undefined } | { error: string } {
  const ids = (body as { ids?: unknown } | null)?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_SEEN_IDS) {
    return { error: `ids must be a list of 1 to ${MAX_SEEN_IDS} achievement ids.` };
  }
  if (!ids.every((id) => typeof id === 'string' && Types.ObjectId.isValid(id))) {
    return { error: 'ids must be achievement ids.' };
  }
  return { value: [...new Set(ids as string[])] };
}
