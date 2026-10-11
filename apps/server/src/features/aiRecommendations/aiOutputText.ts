// A check every AI reply gets, whatever its kind: the model sometimes slips letters of another
// writing system into a Hebrew word ("קลาสית" with Thai letters, seen in a real run). The coach
// reads these texts in Hebrew or English only, so anything else is a problem the model must fix.

/**
 * Hebrew and Latin letters, plus Unicode's script-neutral characters: digits, punctuation, symbols,
 * spaces and emoji (Common) and the marks that attach to them (Inherited — accents, emoji joiners).
 * Digits of other scripts (Arabic-Indic, Thai…) belong to their script and are refused.
 */
const FOREIGN_CHARACTERS = /[^\p{Script=Hebrew}\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]+/gu;

/** Enough for the model to see the pattern; a reply full of them doesn't need each one listed. */
const MAX_TEXT_ISSUES = 5;

const MAX_QUOTED_TEXT = 60;

function quote(text: string): string {
  return text.length > MAX_QUOTED_TEXT ? `${text.slice(0, MAX_QUOTED_TEXT)}…` : text;
}

function collect(value: unknown, path: string, issues: string[]): void {
  if (typeof value === 'string') {
    const found = value.match(FOREIGN_CHARACTERS);
    if (found) {
      issues.push(
        `${path || 'The reply'} contains characters from another writing system (${found.map((part) => `"${part}"`).join(', ')}) in "${quote(value)}". ` +
          'Rewrite that text using only Hebrew or English letters, digits, punctuation and emoji.',
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collect(item, `${path}[${index}]`, issues));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) collect(item, path ? `${path}.${key}` : key, issues);
  }
}

/** Issues (sentences for the model) for every text in the reply with characters outside Hebrew / Latin / neutral. */
export function findForeignTextIssues(reply: unknown): string[] {
  const issues: string[] = [];
  collect(reply, '', issues);
  return issues.slice(0, MAX_TEXT_ISSUES);
}
