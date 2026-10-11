// Build-time settings (Vite `VITE_*` variables — see apps/dashboard/.env.example).

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

/** The trainees' app (apps/mobile). null when not set or not a web address — its link is hidden. */
export const TRAINEE_APP_URL = readHttpUrl(import.meta.env.VITE_TRAINEE_APP_URL);
