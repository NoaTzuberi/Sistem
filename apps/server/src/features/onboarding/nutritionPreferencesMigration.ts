import { OnboardingResponse } from './onboardingResponse.model';

// Phase 13a+: the "Nutrition preferences" answers moved from the 13a shape
// { dietType, kosher, allergies: string[], allergyNotes, dislikes } to v2 (items with
// details, religious, intolerances, loves / dislikes, meals per day). Only dev data has the
// old shape; this rewrites it once at server start (idempotent — a v2 answer has no
// `kosher` field) so the rest of the code only ever sees v2.

interface LegacyPreferences {
  dietType?: string;
  kosher?: boolean;
  allergies?: unknown[];
  allergyNotes?: string;
  dislikes?: string;
}

const LEGACY_FILTER = { 'answers.nutritionPreferences.kosher': { $exists: true } };

/** v1 → v2; exported for the tests. */
export function toV2Preferences(legacy: LegacyPreferences): Record<string, unknown> {
  const allergies = (legacy.allergies ?? [])
    .filter((id): id is string => typeof id === 'string')
    .map((id) => ({ id }));
  const notes = legacy.allergyNotes?.trim();
  if (notes) allergies.push({ id: 'other', details: notes } as { id: string });
  return {
    dietType: legacy.dietType ?? 'none',
    dietStyles: [],
    religious: legacy.kosher ? [{ id: 'kosher' }] : [],
    intolerances: [],
    allergies,
    ...(legacy.dislikes?.trim() ? { foodsDisliked: legacy.dislikes.trim() } : {}),
    mealsPerDay: null,
  };
}

/** Returns how many answers were rewritten. */
export async function migrateLegacyNutritionPreferences(): Promise<number> {
  // The raw collection: the v2 schema would refuse (or drop) the old fields on read.
  const collection = OnboardingResponse.collection;
  const legacy = await collection.find(LEGACY_FILTER, { projection: { 'answers.nutritionPreferences': 1 } }).toArray();
  for (const doc of legacy) {
    const preferences = (doc.answers as { nutritionPreferences: LegacyPreferences }).nutritionPreferences;
    await collection.updateOne({ _id: doc._id, ...LEGACY_FILTER }, { $set: { 'answers.nutritionPreferences': toV2Preferences(preferences) } });
  }
  return legacy.length;
}
