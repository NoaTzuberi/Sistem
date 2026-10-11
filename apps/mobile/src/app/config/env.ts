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
