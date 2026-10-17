import { PORTION_GROUPS, fill, formatNumber, useCopy, useLanguage } from '@sistem/shared';
import type { PortionGroup } from '@sistem/types';
import { splitTotal } from '../data/settingsForm';
import type { SettingsForm } from '../data/settingsForm';
import { nutritionLibraryCopy } from '../copy';

export interface SplitSegment {
  group: PortionGroup;
  pct: number;
}

/**
 * The portion split as she types it: the total, the bar's segments (empty and 0 shares left out) and,
 * while the total isn't 100, how far off it is — the card's alert and the reason save is blocked.
 */
export function usePortionSplit(form: SettingsForm | undefined) {
  const copy = useCopy(nutritionLibraryCopy);
  const language = useLanguage();
  const total = form ? splitTotal(form) : 100;
  const isComplete = Math.abs(total - 100) <= 0.01;
  const segments: SplitSegment[] = form
    ? PORTION_GROUPS.map((group) => ({ group, pct: form.portionSplit[group] ?? 0 })).filter((segment) => segment.pct > 0)
    : [];
  const off = formatNumber(Math.round(Math.abs(100 - total) * 100) / 100, language);
  const message = isComplete ? undefined : fill(total < 100 ? copy.splitMissing : copy.splitOver, { pct: off });
  return { total, isComplete, segments, message };
}
