import type {
  FamilyReviewReason,
  Language,
  PersonalRecordType,
  PatternId,
  SplitConfig,
  TrainingConfig,
  TrainingSlot,
  VariantId,
  WorkoutTypeConfig,
} from '@sistem/types';
import { sharedCopy } from './copy';
import { fill, formatPlural } from './i18n/copy';
import { formatDuration, humanizeId } from './format';

// Phase 12b labels: config ids → words in the coach's language. A coach-added slot / type carries
// its own label (her content, shown as written); an unknown id falls back to the humanized id.

function byId(map: Record<string, string>, id: string): string {
  return map[id] ?? humanizeId(id);
}

export function patternLabel(id: PatternId | string, language: Language): string {
  return byId(sharedCopy[language].training.patterns, id);
}

export function workoutTypeLabel(type: Pick<WorkoutTypeConfig, 'id' | 'label'> | string | undefined, language: Language): string {
  if (!type) return sharedCopy[language].training.free;
  if (typeof type === 'string') return byId(sharedCopy[language].training.workoutTypes, type);
  return type.label ?? byId(sharedCopy[language].training.workoutTypes, type.id);
}

export function slotLabel(slot: Pick<TrainingSlot, 'id' | 'label'>, language: Language): string {
  return slot.label ?? byId(sharedCopy[language].training.slots, slot.id);
}

export function splitLabel(id: string, language: Language): string {
  return byId(sharedCopy[language].training.splits, id);
}

export function variantLabel(id: VariantId | string | undefined, language: Language): string {
  return byId(sharedCopy[language].training.variants, id ?? 'other');
}

export function reviewReasonLabel(id: FamilyReviewReason, language: Language): string {
  return byId(sharedCopy[language].training.reviewReasons, id);
}

/** "Upper / Lower · 4 days a week". */
export function describeSplit(splitId: string, daysPerWeek: number, language: Language): string {
  return `${splitLabel(splitId, language)} · ${formatPlural(language, sharedCopy[language].training.daysPerWeek, daysPerWeek)}`;
}

/** The workout types of a split's day count, in order (empty when it has none for that count). */
export function splitWorkoutTypes(split: SplitConfig | undefined, daysPerWeek: number): string[] {
  return split?.days[String(daysPerWeek)] ?? [];
}

export function findWorkoutType(config: TrainingConfig | null | undefined, id: string | undefined): WorkoutTypeConfig | undefined {
  return id ? config?.workoutTypes.find((type) => type.id === id) : undefined;
}

/** Workout titles for a split's days: "Upper A", "Lower A", "Upper B", … (letters only when a type repeats). */
export function splitWorkoutTitles(typeIds: string[], config: TrainingConfig | null | undefined, language: Language): string[] {
  const totals = new Map<string, number>();
  typeIds.forEach((id) => totals.set(id, (totals.get(id) ?? 0) + 1));
  const seen = new Map<string, number>();
  return typeIds.map((id) => {
    const index = seen.get(id) ?? 0;
    seen.set(id, index + 1);
    const label = workoutTypeLabel(findWorkoutType(config, id) ?? id, language);
    return (totals.get(id) ?? 0) > 1 ? `${label} ${String.fromCharCode(65 + index)}` : label;
  });
}

/** '10 reps × 40 kg' / '45s' — a variant's "last time" in the builder's exercise card. */
export function describePerformance(set: { reps?: number; weight?: number; durationSec?: number }, language: Language): string {
  const copy = sharedCopy[language];
  const amount =
    set.durationSec !== undefined ? formatDuration(set.durationSec, language) : fill(copy.log.reps, { reps: set.reps ?? '—' });
  return set.weight !== undefined ? `${amount} × ${set.weight} ${copy.units.kg}` : amount;
}

/** A variant's newest PR: '45 kg', '12 reps (at 40 kg)', '1 min 15s'. */
export function describeBest(best: { type: PersonalRecordType; value: number; weight?: number }, language: Language): string {
  const copy = sharedCopy[language];
  const at = best.weight !== undefined ? fill(copy.log.prAt, { weight: `${best.weight} ${copy.units.kg}` }) : '';
  switch (best.type) {
    case 'weight':
      return `${best.value} ${copy.units.kg}`;
    case 'reps':
      return `${fill(copy.log.reps, { reps: best.value })}${at}`;
    case 'duration':
      return `${formatDuration(best.value, language)}${at}`;
  }
}
