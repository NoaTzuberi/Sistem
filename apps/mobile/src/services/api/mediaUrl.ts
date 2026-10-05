// VITE_API_URL may be relative ("/api" behind the dev proxy, see `npm run dev:phone`).
const API_ORIGIN = new URL(import.meta.env.VITE_API_URL, window.location.origin).origin;

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
