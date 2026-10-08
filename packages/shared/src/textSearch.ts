// Typo-tolerant search for short lists the client already has (the food picker / food list, 13a+). The same scoring
// as the server's exercise search (apps/server/src/features/exercises/exerciseSearch.ts) — exact, prefix, substring,
// every word present, then per-word similarity — plus Hebrew punctuation folding (geresh / gershayim, maqaf).
// The server never imports this package, so the algorithm lives in both places.

const FUZZY_THRESHOLD = 0.72;

/** Lowercase, Hebrew geresh / gershayim → ASCII quotes, maqaf / dashes → space, collapsed spaces. */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[׳`’‘]/g, "'")
    .replace(/[״“”]/g, '"')
    .replace(/[־–—-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return text.split(/[\s'"()/,.]+/).filter(Boolean);
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

function similarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 1 : 1 - levenshteinDistance(a, b) / maxLength;
}

/** Higher is more relevant; 0 = not a match. */
export function scoreSearchText(query: string, text: string): number {
  const q = normalizeSearchText(query);
  const t = normalizeSearchText(text);
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 92;
  if (t.includes(q)) return 85;

  const queryTokens = tokenize(q);
  const textTokens = tokenize(t);
  if (queryTokens.length === 0) return 0;
  if (queryTokens.every((qt) => textTokens.some((tt) => tt.includes(qt)))) return 70;

  const best = queryTokens.map((qt) => Math.max(0, ...textTokens.map((tt) => similarity(qt, tt))));
  const average = best.reduce((sum, value) => sum + value, 0) / best.length;
  return average >= FUZZY_THRESHOLD ? Math.round(average * 60) : 0;
}

/** The items matching `query`, best first (stable for equal scores); every item when the query is empty. */
export function searchByText<T>(items: readonly T[], query: string, textOf: (item: T) => string): T[] {
  if (!normalizeSearchText(query)) return [...items];
  return items
    .map((item, index) => ({ item, index, score: scoreSearchText(query, textOf(item)) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}
