// Build-time settings (Vite `VITE_*` variables — see apps/mobile/.env.example).

function readHttpUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const { protocol } = new URL(trimmed);
    return protocol === 'https:' || protocol === 'http:' ? trimmed : null;
  } catch {
    return null;
  }
}

/** The coach's web dashboard (apps/dashboard). null when not set or not a web address — its links are hidden. */
export const COACH_DASHBOARD_URL = readHttpUrl(import.meta.env.VITE_COACH_DASHBOARD_URL);

/**
 * True on a static host that cannot answer inner addresses (GitHub Pages): routes then live
 * after a "#", so a refresh never asks the host for a page it does not have.
 */
export const USES_HASH_ROUTER = import.meta.env.VITE_HASH_ROUTER === 'true';
