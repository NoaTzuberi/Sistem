import type { ExerciseFacts } from '@sistem/types';
import { cleanExerciseName } from '../exercises/exerciseName';
import {
  EQUIPMENT_TO_VARIANT,
  EQUIPMENT_WORDS,
  FILLER_WORDS,
  LOAD_WORDS,
  SOURCE_PREFIXES,
  SOURCE_SUFFIX,
  SPELLING_FOLDS,
  type VariantId,
} from './exerciseFamily.constants';
import type { PatternId } from '../exercises/exercise.constants';

// Pure: groups library exercises into families of the same movement with different equipment
// (Phase 12b, step 0b). A family is one key = movement words (name without source prefixes,
// equipment words and spelling differences) + body part + type. Inside a family every
// variant (equipment) has one PRIMARY exercise; the other exercises of that variant are copies
// from other source programs — they keep their ids (plans, logs and PRs still resolve) but
// are not offered in the picker or to the AI.

const SOURCE_PREFIX_PATTERN = new RegExp(
  `^(?:${SOURCE_PREFIXES.map((prefix) => prefix.replace(/\s+/g, '\\s+')).join('|')})\\s+`,
  'i',
);

function stripSourcePrefixes(name: string): string {
  let current = name;
  // Some titles carry two ("UNS Banded …" after "30 …").
  for (let i = 0; i < 2; i += 1) current = current.replace(SOURCE_PREFIX_PATTERN, '');
  return current.replace(SOURCE_SUFFIX, '').replace(/[-–]\s*$/, '').trim();
}

/** The movement words of a name: what stays the same across its equipment variants. */
export function movementKey(name: string): string {
  let key = stripSourcePrefixes(cleanExerciseName(name)).toLowerCase();
  for (const { pattern } of EQUIPMENT_WORDS) key = key.replace(pattern, ' ');
  key = key.replace(LOAD_WORDS, ' ');
  for (const [pattern, replacement] of SPELLING_FOLDS) key = key.replace(pattern, replacement);
  key = key.replace(FILLER_WORDS, ' ');
  return key.replace(/[^a-z0-9/]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Which variant an exercise is: the name's equipment word, else its library equipment. */
export function variantOf(name: string, equipment: string[]): VariantId {
  const lower = cleanExerciseName(name).toLowerCase();
  for (const { pattern, variant } of EQUIPMENT_WORDS) {
    pattern.lastIndex = 0;
    if (pattern.test(lower)) {
      pattern.lastIndex = 0;
      return variant;
    }
  }
  return EQUIPMENT_TO_VARIANT[equipment[0] ?? 'bodyweight'] ?? 'other';
}

/**
 * Plain names first (lower is better): no source prefix, no "- variation" suffix, short.
 * Used to choose each variant's primary exercise and the family's display name.
 */
export function plainNameRank(name: string): number {
  const cleaned = cleanExerciseName(name);
  let rank = cleaned.length;
  if (/^\d/.test(cleaned)) rank += 30; // "180 Jump …", "3-Way …"
  if (stripSourcePrefixes(cleaned) !== cleaned.replace(/[-–]\s*$/, '').trim()) rank += 50;
  if (/[-–]\s*$/.test(cleaned) || /\s[-–]\s/.test(cleaned)) rank += 15;
  if (/\(|\)|\//.test(cleaned)) rank += 10;
  if (/\bweighted\b/i.test(cleaned)) rank += 5;
  return rank;
}

function titleCase(words: string): string {
  return words.replace(/(^|[\s-])([a-z])/g, (_match, start: string, letter: string) => start + letter.toUpperCase());
}

/** "Dumbbell bent-over row" → "Bent-Over Row": the plainest member without its equipment words. */
export function familyDisplayName(memberName: string): string {
  let name = stripSourcePrefixes(cleanExerciseName(memberName));
  for (const { pattern } of EQUIPMENT_WORDS) name = name.replace(new RegExp(pattern.source, 'gi'), ' ');
  name = name.replace(new RegExp(LOAD_WORDS.source, 'gi'), ' ');
  name = name.replace(/\b(?:with|using)\s*$/i, '').replace(/\s*-\s*$/, '');
  name = name.replace(/\s+/g, ' ').replace(/^\s*[-–]\s*/, '').trim();
  return name ? titleCase(name.toLowerCase()) : titleCase(cleanExerciseName(memberName).toLowerCase());
}

export interface GroupedVariant {
  exerciseId: string;
  variant: VariantId;
  /** The one exercise per variant offered in the picker, the slots and to the AI. */
  primary: boolean;
}

export const REVIEW_REASON_IDS = ['unclear_pattern', 'pattern_differs', 'ambiguous_name', 'many_copies'] as const;
export type ReviewReason = (typeof REVIEW_REASON_IDS)[number];

export interface GroupedFamily {
  /** movement key | patterns (or ?body part when unclear) | type — stable across re-runs. */
  key: string;
  name: string;
  /** Every body part its members are filed under (the dataset is inconsistent). */
  muscles: string[];
  movementType: string;
  patterns: PatternId[];
  members: GroupedVariant[];
  reviewReasons: ReviewReason[];
}

/** The library facts the grouping reads, with each exercise's pattern tagging. */
export interface GroupingInput extends ExerciseFacts {
  patterns: PatternId[];
  unclear: boolean;
}

/**
 * Same name + same patterns + same type = one family, whatever body part the dataset gave.
 * Without patterns the name alone is not trusted: the body part stays in the key.
 */
export function familyKeyOf(exercise: Pick<GroupingInput, 'name' | 'primaryMuscles' | 'movementType' | 'patterns' | 'unclear'>): string {
  const patternPart = exercise.patterns.length > 0 ? exercise.patterns.join('+') : `?${exercise.primaryMuscles[0] ?? 'none'}`;
  return [movementKey(exercise.name), patternPart, exercise.movementType].join('|');
}

/** Copies of one variant above this: worth a look (a real setup difference may hide in there). */
export const MANY_COPIES = 4;

export interface GroupingOptions {
  /** Ranked first when choosing a variant's primary: the coach's chosen primaries, then exercises she used. */
  preferredIds?: string[];
}

/** Chooses each variant's primary inside one family's members (also for coach-built families). */
export function assignVariants(
  members: Pick<ExerciseFacts, 'id' | 'name' | 'equipment'>[],
  preferredIds: string[] = [],
): { variants: GroupedVariant[]; copiesPerVariant: Map<VariantId, number> } {
  const rank = new Map(preferredIds.map((id, index) => [id, index]));
  const sorted = [...members].sort(
    (a, b) =>
      (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) ||
      plainNameRank(a.name) - plainNameRank(b.name) ||
      a.name.localeCompare(b.name) ||
      a.id.localeCompare(b.id),
  );
  const copiesPerVariant = new Map<VariantId, number>();
  const variants = sorted.map((exercise) => {
    const variant = variantOf(exercise.name, exercise.equipment);
    const count = (copiesPerVariant.get(variant) ?? 0) + 1;
    copiesPerVariant.set(variant, count);
    return { exerciseId: exercise.id, variant, primary: count === 1 };
  });
  return { variants, copiesPerVariant };
}

export function groupExercises(exercises: GroupingInput[], options: GroupingOptions = {}): GroupedFamily[] {
  const byKey = new Map<string, GroupingInput[]>();
  for (const exercise of exercises) {
    const key = familyKeyOf(exercise);
    byKey.set(key, [...(byKey.get(key) ?? []), exercise]);
  }

  // Keys sharing the movement words but not the patterns / type: the name alone was not enough.
  const keysByMovement = new Map<string, string[]>();
  for (const key of byKey.keys()) {
    const movement = key.split('|')[0];
    keysByMovement.set(movement, [...(keysByMovement.get(movement) ?? []), key]);
  }

  const families: GroupedFamily[] = [];
  for (const [key, members] of [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const { variants, copiesPerVariant } = assignVariants(members, options.preferredIds);
    const first = members.find((member) => member.id === variants[0].exerciseId)!;
    const reasons = new Set<ReviewReason>();
    if (members.some((member) => member.unclear)) reasons.add('unclear_pattern');
    const siblings = keysByMovement.get(key.split('|')[0]) ?? [];
    if (siblings.length > 1) {
      reasons.add(siblings.some((sibling) => sibling.split('|')[1].startsWith('?')) ? 'ambiguous_name' : 'pattern_differs');
    }
    if ([...copiesPerVariant.values()].some((count) => count > MANY_COPIES)) reasons.add('many_copies');
    // The equipment word leaves the name only when the family really has several variants.
    const variantCount = variants.filter((variant) => variant.primary).length;
    families.push({
      key,
      name: variantCount > 1 ? familyDisplayName(first.name) : stripSourcePrefixes(cleanExerciseName(first.name)),
      muscles: [...new Set(members.flatMap((member) => member.primaryMuscles))].sort(),
      movementType: first.movementType,
      patterns: first.patterns,
      members: variants,
      reviewReasons: [...reasons].sort(),
    });
  }
  return families;
}
