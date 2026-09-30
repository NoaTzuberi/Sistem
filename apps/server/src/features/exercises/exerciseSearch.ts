/**
 * Relevance scoring for the exercise search box. Plain in-process scoring
 * rather than MongoDB Atlas Search or a fuzzy-search package: the public
 * catalog is only ~100 published exercises today (most of the ~2,900
 * imported records aren't published yet), so scoring every candidate in
 * Node per request is trivial — and it sidesteps standing up an Atlas
 * Search index (a real infra step, not just code) for a dataset this size.
 */

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[\s-]+/)
    .filter(Boolean);
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previousRow = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const currentRow = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow.push(Math.min(currentRow[j - 1] + 1, previousRow[j] + 1, previousRow[j - 1] + cost));
    }
    previousRow = currentRow;
  }

  return previousRow[b.length];
}

/** 1 = identical, 0 = completely different. */
function similarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLength;
}

const FUZZY_THRESHOLD = 0.72;

/**
 * Scores one piece of text (an exercise name or a single alias) against a
 * search query. Higher is more relevant; 0 means "not a match, exclude it."
 * Tries cheap, exact-ish checks first (exact match, prefix, substring,
 * every query word present somewhere) before falling back to per-word
 * fuzzy similarity, which is what catches genuine typos/misspellings.
 */
export function scoreText(query: string, text: string): number {
  const normalizedQuery = normalize(query);
  const normalizedText = normalize(text);
  if (!normalizedQuery) return 0;

  if (normalizedText === normalizedQuery) return 100;
  if (normalizedText.startsWith(normalizedQuery)) return 92;
  if (normalizedText.includes(normalizedQuery)) return 85;

  const queryTokens = tokenize(normalizedQuery);
  const textTokens = tokenize(normalizedText);

  const everyTokenPresent = queryTokens.every(
    (qt) => textTokens.some((tt) => tt.includes(qt)) || normalizedText.includes(qt),
  );
  if (everyTokenPresent) return 70;

  const perTokenBestSimilarity = queryTokens.map((qt) => {
    let best = 0;
    for (const tt of textTokens) {
      const sim = similarity(qt, tt);
      if (sim > best) best = sim;
    }
    return best;
  });
  const averageSimilarity = perTokenBestSimilarity.reduce((sum, s) => sum + s, 0) / perTokenBestSimilarity.length;

  return averageSimilarity >= FUZZY_THRESHOLD ? Math.round(averageSimilarity * 60) : 0;
}

/** Best score across an exercise's name and all its aliases (aliases weighted slightly lower). */
export function scoreExercise(query: string, name: string, aliases: string[]): number {
  const nameScore = scoreText(query, name);
  const aliasScore = aliases.length > 0 ? Math.max(...aliases.map((alias) => scoreText(query, alias) * 0.9)) : 0;
  return Math.max(nameScore, aliasScore);
}
