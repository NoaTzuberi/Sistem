import type { Language } from '@sistem/types';

// The copy files (Phase 15). Every feature keeps its texts in copy/he.ts (the primary,
// complete locale) and copy/en.ts, typed from the Hebrew one — a missing or extra English
// key fails the build. Placeholders are written {name}; counts go through plural().

/** The forms Intl.PluralRules can ask for; Hebrew uses one / two / other, English one / other. */
export interface PluralForms {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

/** A counted text. Branded so the copy types (and the parity test) never mistake it for a group of keys. */
export interface Plural {
  readonly kind: 'plural';
  readonly forms: PluralForms;
}

export function plural(forms: PluralForms): Plural {
  return { kind: 'plural', forms };
}

/** The shape of a locale: same keys, any wording. */
export type CopyShape<T> = T extends string
  ? string
  : T extends Plural
    ? Plural
    : T extends readonly (infer Item)[]
      ? readonly CopyShape<Item>[]
      : { [K in keyof T]: CopyShape<T[K]> };

export type CopyDefinition<T> = Record<Language, CopyShape<T>>;

/** Both locales of one feature. The English object must match the Hebrew one key for key. */
export function defineCopy<T>(he: T, en: CopyShape<T>): CopyDefinition<T> {
  return { he: he as CopyShape<T>, en };
}

export type CopyVars = Record<string, string | number>;

/** 'שלום {name}' + { name: 'נועה' } → 'שלום נועה'. An unknown placeholder stays as written (easy to spot). */
export function fill(template: string, vars?: CopyVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

const pluralRules = new Map<Language, Intl.PluralRules>();

function rulesFor(language: Language): Intl.PluralRules {
  let rules = pluralRules.get(language);
  if (!rules) {
    rules = new Intl.PluralRules(language);
    pluralRules.set(language, rules);
  }
  return rules;
}

/** The form for `count` (falling back to `other`), with {count} and any other placeholders filled. */
export function formatPlural(language: Language, entry: Plural, count: number, vars?: CopyVars): string {
  const category = rulesFor(language).select(count) as keyof PluralForms;
  const template = entry.forms[category] ?? entry.forms.other;
  return fill(template, { count, ...vars });
}
