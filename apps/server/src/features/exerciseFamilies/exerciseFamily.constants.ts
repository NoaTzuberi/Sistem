// Grouping imported exercises into families of equipment variants (Phase 12b, step 0b).
// Only the factual fields are used: the name (cleaned), the body part, the equipment and the type.

/**
 * How a variant is labelled for the coach. Taken from the name when it says so ("Smith machine
 * squat" is filed as 'machine' or 'barbell' in the dataset), else from the library equipment.
 */
export const VARIANT_IDS = [
  'barbell',
  'dumbbell',
  'kettlebell',
  'smith_machine',
  'cable',
  'band',
  'machine',
  'ez_bar',
  'trap_bar',
  'plate',
  'medicine_ball',
  'exercise_ball',
  'bodyweight',
  'other',
] as const;
export type VariantId = (typeof VARIANT_IDS)[number];

/**
 * Words in a name that only say which equipment is used, in match order (longer phrases
 * first). Stripped for the family key; the first one found labels the variant.
 */
export const EQUIPMENT_WORDS: { pattern: RegExp; variant: VariantId }[] = [
  { pattern: /\bsmith[- ]machine\b|\bsmith\b/g, variant: 'smith_machine' },
  { pattern: /\be-?z[- ]?(?:curl[- ])?bar\b/g, variant: 'ez_bar' },
  { pattern: /\b(?:trap|hex)[- ]bar\b/g, variant: 'trap_bar' },
  { pattern: /\bmedicine[- ]ball\b|\bmed[- ]ball\b/g, variant: 'medicine_ball' },
  { pattern: /\b(?:exercise|stability|swiss)[- ]ball\b/g, variant: 'exercise_ball' },
  { pattern: /\bbarbells?\b/g, variant: 'barbell' },
  { pattern: /\bdumbbells?\b/g, variant: 'dumbbell' },
  { pattern: /\bkettlebells?\b/g, variant: 'kettlebell' },
  { pattern: /\bcables?\b/g, variant: 'cable' },
  { pattern: /\b(?:resistance[- ])?bands?\b|\bbanded\b|\bmini[- ]bands?\b/g, variant: 'band' },
  { pattern: /\bmachines?\b|\blever\b/g, variant: 'machine' },
  { pattern: /\bplate[- ]weighted\b|\bplates?\b/g, variant: 'plate' },
  { pattern: /\bbody[- ]?weight\b/g, variant: 'bodyweight' },
];

/** "Weighted" says only that a load is added — the variant comes from the equipment field. */
export const LOAD_WORDS = /\bweighted\b/g;

/** Library equipment → variant, when the name doesn't say. */
export const EQUIPMENT_TO_VARIANT: Record<string, VariantId> = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  kettlebell: 'kettlebell',
  cable: 'cable',
  resistance_band: 'band',
  machine: 'machine',
  ez_curl_bar: 'ez_bar',
  medicine_ball: 'medicine_ball',
  exercise_ball: 'exercise_ball',
  bodyweight: 'bodyweight',
  no_equipment: 'bodyweight',
  pull_up_bar: 'bodyweight',
  foam_roller: 'other',
  battle_rope: 'other',
  other: 'other',
};

/**
 * Program / brand prefixes of the source collections ("HM Push-Up", "FYR2 Dumbbell Deadlift",
 * "Holman Weighted Burpee", "King Maker Leg Press"). Stripped for the family key only — the
 * name shown stays as it is. Real names that look like prefixes (JM press, TRX, BOSU, BFR)
 * are not here.
 */
export const SOURCE_PREFIXES = [
  'HM', 'FYR2', 'FYR', 'AM', 'UP', 'TBS', 'UNS', 'UN', 'ACFT', 'KV', 'RG', 'PJR', 'AA', 'CM', 'LD',
  'Holman', 'Dumbbell Fix', 'Total Fitness', 'King Maker', 'Paul Carter', 'Muscle Beach', 'Tyler Holt',
  'Boss Everline', 'Jordan Shallow', 'Rusin', 'Robertson', 'MetaBurn', 'Taylor', 'Gironda',
];

/** A source program's own version of a lift ("Squat - Gethin Variation"): same movement. */
export const SOURCE_SUFFIX = /\s*-\s*gethin variation\s*$/i;

/** Spellings folded together so "Push-ups", "Pushup" and "push up" make one key. */
export const SPELLING_FOLDS: [RegExp, string][] = [
  [/\bpush[- ]?ups?\b/g, 'pushup'],
  [/\bpull[- ]?ups?\b/g, 'pullup'],
  [/\bchin[- ]?ups?\b/g, 'chinup'],
  [/\bsit[- ]?ups?\b/g, 'situp'],
  [/\bstep[- ]?ups?\b/g, 'stepup'],
  [/\bkick[- ]?backs?\b/g, 'kickback'],
  [/\bpull[- ]?downs?\b/g, 'pulldown'],
  [/\bpush[- ]?downs?\b/g, 'pushdown'],
  [/\bskull[- ]?crushers?\b/g, 'skullcrusher'],
  [/\bflyes\b|\bflys\b|\bflies\b/g, 'fly'],
  [/\bromanian deadlifts?\b|\brdls?\b/g, 'romanian deadlift'],
  [/\bbent[- ]over\b/g, 'bent over'],
  [/\b(raise|curl|row|press|squat|lunge|deadlift|extension|shrug|crunch|thrust|bridge|swing)(?:es|s)\b/g, '$1'],
];

/** Joining words left over once equipment words are gone ("Squat with Bands" → "squat"). */
export const FILLER_WORDS = /\b(?:with|using|on|a|an|the)\b/g;
