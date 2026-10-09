// Phase 15 — every copy has the same keys in Hebrew and English, the same {placeholders}, and the
// plural forms each language needs. Runs with `npm test` (root). Covers the mobile app, the
// dashboard, @sistem/shared and the server messages.
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');
const SOURCES = ['apps/mobile/src', 'apps/dashboard/src', 'packages/shared/src'];

function findCopyDirs(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (!statSync(full).isDirectory() || name === 'node_modules') continue;
    if (name === 'copy') found.push(full);
    else findCopyDirs(full, found);
  }
  return found;
}

type Tree = { [key: string]: unknown };

function isPlural(value: unknown): value is { kind: 'plural'; forms: Record<string, string> } {
  return typeof value === 'object' && value !== null && (value as { kind?: unknown }).kind === 'plural';
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

/** Every leaf as path → its text (a plural: its forms). */
function leaves(tree: Tree, prefix = ''): Map<string, string | Record<string, string>> {
  const out = new Map<string, string | Record<string, string>>();
  for (const [key, value] of Object.entries(tree)) {
    const at = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(at, value);
    else if (isPlural(value)) out.set(at, value.forms);
    else if (typeof value === 'object' && value !== null) for (const [k, v] of leaves(value as Tree, at)) out.set(k, v);
    else out.set(at, String(value));
  }
  return out;
}

const pluralCategories = (language: string) => new Intl.PluralRules(language).resolvedOptions().pluralCategories;

function checkPair(he: Tree, en: Tree) {
  const heLeaves = leaves(he);
  const enLeaves = leaves(en);
  expect([...enLeaves.keys()].sort(), 'same keys').toEqual([...heLeaves.keys()].sort());

  for (const [key, heValue] of heLeaves) {
    const enValue = enLeaves.get(key)!;
    if (typeof heValue === 'string' || typeof enValue === 'string') {
      expect(typeof heValue, `${key}: both plain or both plural`).toBe(typeof enValue);
      expect(placeholders(heValue as string), `${key}: placeholders`).toEqual(placeholders(enValue as string));
      continue;
    }
    for (const [language, forms] of [['he', heValue], ['en', enValue]] as const) {
      for (const category of pluralCategories(language)) {
        expect(forms[category], `${key}: ${language} needs the "${category}" form`).toBeTypeOf('string');
      }
    }
    // A form may spell the number out ("שבוע אחד"); the other placeholders must match.
    const rest = (forms: Record<string, string>) =>
      [...new Set(Object.values(forms).flatMap(placeholders))].filter((name) => name !== 'count').sort();
    expect(rest(heValue), `${key}: placeholders`).toEqual(rest(enValue));
  }
}

describe('copy parity (Phase 15)', () => {
  const dirs = SOURCES.flatMap((source) => findCopyDirs(path.join(ROOT, source)));

  it('finds the copy folders', () => {
    expect(dirs.length).toBeGreaterThan(10);
  });

  for (const dir of dirs) {
    it(path.relative(ROOT, dir), async () => {
      const { he } = await import(path.join(dir, 'he.ts'));
      const { en } = await import(path.join(dir, 'en.ts'));
      checkPair(he, en);
    });
  }

  it('apps/server/src/i18n/locales', async () => {
    const { he } = await import(path.join(ROOT, 'apps/server/src/i18n/locales/he.ts'));
    const { en } = await import(path.join(ROOT, 'apps/server/src/i18n/locales/en.ts'));
    checkPair(he, en);
  });
});
