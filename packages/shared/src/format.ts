// Display helpers. Functional placeholder formats — the owner decides final wording.

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** 'build_muscle' → 'Build muscle'. Ids are shown as they are until real labels exist. */
export function humanizeId(id: string): string {
  const text = id.replace(/_/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function humanizeList(ids: string[] | undefined): string {
  return ids && ids.length > 0 ? ids.map(humanizeId).join(', ') : '—';
}

/** Date-only strings ('YYYY-MM-DD') have no time zone: always format them in UTC. */
function parseDateOnly(dateString: string): Date {
  return new Date(`${dateString}T00:00:00Z`);
}

export function addDaysToDate(dateString: string, days: number): string {
  return new Date(parseDateOnly(dateString).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

const dateOnlyFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatDateOnly(dateString: string): string {
  return dateOnlyFormat.format(parseDateOnly(dateString));
}

const dayMonthFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });

/** A plan week from its Sunday: '27 Sept – 3 Oct'. */
export function formatWeekRange(weekStartDate: string): string {
  const lastDay = parseDateOnly(addDaysToDate(weekStartDate, 6));
  return `${dayMonthFormat.format(parseDateOnly(weekStartDate))} – ${dayMonthFormat.format(lastDay)}`;
}

const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

function formatHoursMinutes(ms: number): string {
  const hours = Math.floor(ms / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/** The 48h window: how long is left, or by how much it is overdue. */
export function formatTimeLeft(dueAt: string, nowMs: number): { text: string; isOverdue: boolean } {
  const leftMs = new Date(dueAt).getTime() - nowMs;
  return leftMs >= 0
    ? { text: `${formatHoursMinutes(leftMs)} left`, isOverdue: false }
    : { text: `Overdue by ${formatHoursMinutes(-leftMs)}`, isOverdue: true };
}

export function formatTimeAgo(iso: string, nowMs: number): string {
  const agoMs = Math.max(0, nowMs - new Date(iso).getTime());
  if (agoMs < HOUR_MS) return `${Math.max(1, Math.floor(agoMs / MINUTE_MS))} min ago`;
  if (agoMs < DAY_MS) return `${Math.floor(agoMs / HOUR_MS)}h ago`;
  const days = Math.floor(agoMs / DAY_MS);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

export function formatDuration(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes === 0) return `${seconds}s`;
  return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds}s`;
}
