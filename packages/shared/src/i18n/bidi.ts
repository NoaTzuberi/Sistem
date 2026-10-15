// Numbers inside right-to-left text (Phase 15). The Unicode bidi rules reorder neutral
// characters between numbers in RTL, so '3 × 10' would show as '10 × 3' and '8–12' as
// '12–8'. These expressions are wrapped in a left-to-right isolate (LRI … PDI): their
// inside always reads left to right, the outside follows the sentence. Harmless in LTR.

const LRI = '\u2066';
const PDI = '\u2069';

export function isolateLtr(text: string): string {
  return `${LRI}${text}${PDI}`;
}

const FSI = '\u2068';

/**
 * User or coach text placed inside a sentence (a name, a workout title): its direction comes
 * from its own first letter — the plain-text twin of dir="auto".
 */
export function isolateAuto(text: string): string {
  return `${FSI}${text}${PDI}`;
}

/** The isolate marks removed — for comparisons and inputs. */
export function stripIsolates(text: string): string {
  return text.replace(/[\u2066-\u2069]/g, '');
}
