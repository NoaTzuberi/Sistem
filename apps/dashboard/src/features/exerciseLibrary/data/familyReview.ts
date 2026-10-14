import type { ExerciseFamilyDetail, ExerciseFamilySummary } from '@sistem/types';

export const REVIEW_STATUSES = ['needed', 'unclear', 'reviewed', 'all'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** Still on the review list: it has a reason and the coach has not marked it reviewed. */
export function needsReview(family: Pick<ExerciseFamilySummary, 'reviewReasons' | 'reviewedAt'>): boolean {
  return family.reviewReasons.length > 0 && family.reviewedAt === null;
}

/** The variant with the most exercises in a family, when it has copies: what "many copies" is about. */
export function mostCopiedVariant(family: ExerciseFamilyDetail): { variant: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const member of family.members) counts.set(member.variant, (counts.get(member.variant) ?? 0) + 1);
  const [variant, count] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [];
  return variant !== undefined && count !== undefined && count > 1 ? { variant, count } : null;
}

/** How many exercises (the main one and its copies) a variant of the family has. */
export function variantSize(family: ExerciseFamilyDetail, variant: string): number {
  return family.members.filter((member) => member.variant === variant).length;
}
