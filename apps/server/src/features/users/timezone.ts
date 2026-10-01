/** True for an IANA zone name Node's Intl knows (e.g. 'Asia/Jerusalem'). No dependency needed. */
export function isValidTimezone(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
