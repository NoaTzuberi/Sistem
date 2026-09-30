const API_ORIGIN = new URL(import.meta.env.VITE_API_URL).origin;

/**
 * Server-relative media paths (e.g. /media/...)
 * need the API's origin prepended — the browser otherwise resolves them
 * against the client's own origin, not the API server's.
 */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}
