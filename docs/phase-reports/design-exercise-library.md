# Design update — Exercise Library page (apps/dashboard)

Reference: `docs/design/coach-dashboard.html` → "ספריית תרגילים" (visual reference only; none of
its families, numbers or names were shipped).

## Summary

The library page (`/exercises`) is rebuilt on the dashboard canvas: a header with the library's
totals, a translucent filter panel (search, an iOS-style status control, colored pattern chips),
a list of colored family rows, and a sticky detail card with a colored hero, the family's issue
and its fix, its exercises as cards, and what the builder will offer. Under 1000px the detail
slides in as a full-screen sheet. Every action uses an endpoint that already existed — no server,
API, schema or dependency change.

## The pattern color map (one source of truth)

Tokens `--color-pattern-<group>` / `-soft` in `packages/tokens/tokens.css`; classes
`.pattern-group-<group>` (setting `--pattern-color` / `--pattern-soft`) in
`apps/dashboard/src/styles/globals.css`; which pattern belongs to which group:
`features/exerciseLibrary/data/patternGroups.ts` (`patternGroup`, `patternGroupClass`) — ready for
the plan builder.

Our data has **26 movement patterns**, not the reference's seven names (those are body areas), so
every pattern is mapped to the closest group:

| Group (color) | Patterns |
|---|---|
| רגליים – ברך — peach `#E08A5C / #FFD3B8` | squat, lunge, knee_extension, calf_raise |
| רגליים – ירך — rose `#D46A95 / #F7C6DA` | hinge, glute_bridge, glute_isolation, hip_abduction, hip_adduction, knee_flexion |
| חזה — lilac `#9A77DB / #E6D8FF` | horizontal_push, chest_fly |
| גב — blue `#5E9CC4 / #CFE6F5` | horizontal_pull, vertical_pull, shrug, elbow_flexion (biceps), forearm |
| כתפיים — amber `#D9952B / #FFE3B0` | vertical_push, shoulder_raise, rear_delt, elbow_extension (triceps) |
| ליבה — pink `#FF006E / #FFC2DA` | core, carry |
| כל הגוף — cherry `#A50047 / #F6C9D9` | power, conditioning, mobility |
| no pattern — striped grey "?" | a family without a pattern |

A family is colored by its **first** pattern. The chips and the pattern picker show all 26
patterns (their real names), each with its group's color dot.

## What changed

- **Header** (`LibraryHeader`, `LibrarySummary`) — "ספריית תרגילים", the existing explanation, and two
  white cards from the server's totals: משפחות (2,181) and לבדיקה (197, amber).
- **Filters** (`LibraryFilters` + `StatusSegmented` + `PatternChips`, on a translucent panel)
  - a 44px search pill with a pink focus ring (family name, variant name, muscle — the server's
    search, debounced 300ms);
  - the status control "לבדיקה · N / דפוס לא ברור · N / נבדקו · N / הכול · N" with amber / grey /
    Cherry Rose dots and a white thumb sliding by `transform`; the counts follow the current
    search and pattern;
  - one line of pattern chips (scrolls sideways, no scrollbar): "כל הדפוסים" + the 26 patterns; the
    active chip fills with its color;
  - "ניקוי סינון" while a search or a pattern narrows the list;
  - status and pattern live in the URL (`?status=unclear&pattern=squat`).
- **List** (`FamilyList`, `FamilyRow`, `FamilyTile`) — "N משפחות" above; each row: a 52px tile in
  the pattern's gradient with the family's initials (a striped "?" without a pattern), the name
  (bold, its own direction), "pattern (in its color) · muscle", and at the far end the open issue
  ("עותקים כפולים" amber, "דפוס לא ברור" grey outlined, or the other reason's name) and "N גרסאות".
  Under a fine pointer the row lifts 2px; the selected row has a pink ring and `aria-current`.
  Empty: "לא נמצאו משפחות / נסי חיפוש אחר או נקי את הסינון".
- **Detail** (`FamilyDetail`, sticky; the first family of the filters opens by itself)
  - hero: a blurred cloud in the pattern's color, an 84px tile, the name (34px), chips (each
    pattern filled in its color, the muscles, "N גרסאות"), and "לבדיקה" (amber) or "✓ נבדקה"
    (Cherry Rose);
  - `IssuePanel` (only while the family needs review):
    - unclear pattern (grey): "דפוס התנועה לא ברור", a hint, the 26 colored pattern chips;
      "שמירה וסימון כנבדק" stays disabled until one is picked, then saves the patterns and
      "reviewed" in one call;
    - many copies (amber): the reason's name, which variant has how many copies, and "זה תקין,
      סימון כנבדק";
    - any other reason (grey): its name and "סימון כנבדק";
    - after a save: the pink strip "סומן כנבדק. המשפחה תופיע בבונה ובטיוטות ה-AI." — applied at
      once, undone with an error line if the server refuses. The family stays open after it
      leaves the "לבדיקה" list;
  - "גרסאות" (hint "הראשית מוצעת בבונה וב-AI"): one `VariantCard` per exercise of the family — a
    "אין סרטון" tile in the pattern's soft color, the name, its variant and equipment tags; the
    main exercise of each variant has "★ ראשית" and a pink ring (and "×N" when that variant has N
    exercises); any other card shows "הגדרה כראשית" under the pointer, on keyboard focus, and
    always on touch;
  - "בבונה התוכניות ובטיוטות AI יוצע:" and the main exercise of each variant;
  - `FamilyTools` ("עוד פעולות", folded): the library's existing tools — rename, set the patterns of
    any family, move selected exercises into a new family, merge another family in, and put a
    reviewed family back on the list.
- **≤ 1000px**: the list only; a family opens in `FamilySheet`, a full-screen sheet sliding in
  from the reading-start side (300ms in on the drawer curve, 200ms out), with "→ חזרה לרשימה";
  Esc closes it; the focus goes to the family's title once it has loaded and back to its row on
  close.
- **≤ 640px**: the two summary cards share the row, variants 2 per row, the hero tile 64px.

## Actions — what is wired and what is not

| Action | Status |
|---|---|
| Mark reviewed / back on the list | wired — `PATCH …/exercise-families/:id { reviewed }` |
| Set the movement pattern (+ mark reviewed) | wired — `PATCH … { patterns, reviewed: true }` |
| "הגדרה כראשית" | wired — `PUT …/:id/primary` (makes that exercise the main one **of its variant**) |
| Rename, split, merge another family in | wired (existing endpoints), under "עוד פעולות" |
| **"איחוד ל־1"** (merge the duplicate copies into one) | **omitted** — no endpoint. Copies are kept on purpose (old plans, logs and PRs point at them); only the main one is offered. Adding it would need a server change — ask first. |

## Skipped — no data source

1. **The "גרסאות" summary card (total variants)** — the API returns family totals only; counting
   every variant would mean loading all 2,181 families.
2. **The "ללא דפוס" chip** — the search cannot filter "no pattern". The "דפוס לא ברור" status tab
   is the closest existing filter (it holds the families with no pattern or too many).
3. **Video posters and the play button** — no exercise has media yet (the library is facts only),
   so every card shows the "אין סרטון" tile and there is no play button.
4. **A family-level "main variant"** — our data has a main exercise per *variant* (among its
   copies), not one main variant per family. The ★ marks those; the footer lists them all.

## Decisions I made — please check

1. **Pagination, not virtualization**: 40 families at a time with "עוד (N מתוך M)" — the server
   filters and pages already; the list stays light.
2. **Variant cards show every exercise of the family** (main ones and copies), so a copy can be
   made the main one — the same data as the old members list.
3. **The duplicates explanation** names the variant with the most exercises and its count
   (computed from the family's members).
4. **The existing tools stay**, folded under "עוד פעולות", so nothing the page could do is lost.
5. **Muscle and equipment names** are the English ids (as everywhere today), rendered in their own
   direction inside Hebrew.
6. **Scoped class names**: every class of the page is prefixed by its component (`family-row-`,
   `status-segmented-`, `issue-`…). One collision was found and fixed: the filter panel was first
   `.library-filters`, a name the plan builder's library sheet already uses — it is now
   `.exlib-filters`. A script checked that no other class of the page exists elsewhere.

## New tokens (`packages/tokens/tokens.css`)

`--color-pattern-{knee,hip,chest,back,shoulders,core,full,none}` and `-soft`,
`--gradient-pattern-none`, `--color-warning-text` (#8A4A00), `--color-warning-soft` (#FFF4E5),
`--shadow-row-hover`, `--shadow-row-selected`, `--shadow-tile`, `--shadow-variant-hover`,
`--ring-search`. (The status control reuses the notifications panel's segment tokens.)

## i18n keys — `features/exerciseLibrary/copy` (he + en; English is placeholder)

Added: `summaryFamilies`, `summaryToReview`, `allPatterns`, `clearFilters`, `notFoundTitle`,
`notFoundBody`, `variantCount` (plural), `flagDuplicates`, `reviewedTag`, `noPattern`,
`duplicatesBody`*, `looksFine`, `unclearTitle`, `unclearBody`*, `saveAndReview`, `reviewedNote`,
`variantsTitle`, `variantsHint`, `noVideo`, `mainBadge`, `copiesBadge`, `makeMain`, `offeredNote`,
`backToList`, `moreActions`*.
\* = my placeholder wording; the rest is the brief's / the reference's Hebrew.
Removed (unused now): `patternAny`, `copies`, `empty`, `select`, `muscles`, `reasons`,
`makePrimary`, `level`, `selectMember`.

## Files

Added (each component = `.tsx` + `.css` in its own folder)
- `apps/dashboard/src/features/exerciseLibrary/components/`: `LibraryHeader/`, `LibrarySummary/`,
  `LibraryFilters/`, `StatusSegmented/`, `PatternChips/`, `FamilyList/`, `FamilyRow/`, `FamilyTile/`,
  `IssuePanel/`, `VariantCard/`, `FamilyTools/`, `FamilySheet/`
- `apps/dashboard/src/features/exerciseLibrary/hooks/`: `useLibraryFilters.ts`, `useFamilyList.ts`,
  `useFamilyDetail.ts`, `useFamilyReview.ts`
- `apps/dashboard/src/features/exerciseLibrary/data/`: `patternGroups.ts`, `familyReview.ts`
- `docs/phase-reports/design-exercise-library.md`

Modified
- `packages/tokens/tokens.css`, `apps/dashboard/src/styles/globals.css` (pattern classes)
- `apps/dashboard/src/app/router/AppRouter.tsx` (the page left the white `PagePanel`),
  `components/layout/PagePanel/PagePanel.tsx` (comment)
- `features/exerciseLibrary/pages/ExerciseLibraryPage/` (.tsx + .css),
  `components/FamilyDetail/` (.tsx + .css, rewritten), `copy/he.ts`, `copy/en.ts`

## Dependencies

None added or removed.

## How to test

```
npm run build -w @sistem/dashboard   # passes
npm run lint                         # passes (i18n audit clean; the known fast-refresh warnings)
npm run test:i18n                    # passes (30)
npm run dev:all                      # http://localhost:5174/exercises, seed coach: coach@sistem.dev
```

1. **Header** — משפחות 2181 · לבדיקה 197 (amber).
2. **Status tabs** — each tab: the thumb slides, the list and "N משפחות" follow, the URL keeps it;
   "נבדקו" with none reviewed shows the empty state.
3. **Pattern chip** — the list narrows, the chip fills with its color, "ניקוי סינון" appears; reload
   keeps it.
4. **Search with no results** ("zzzqqq") — the empty state; "ניקוי סינון" restores everything.
5. **A family with no pattern** (e.g. Cobra) — striped "?" tile, "ללא דפוס", the grey issue with
   the pattern chips; pick one → "שמירה וסימון כנבדק" is enabled.
6. **A family with duplicates** (e.g. Squat, V-Up) — amber flag and panel naming the variant and
   its count; "×N" on that variant's main card; "זה תקין, סימון כנבדק" → the pink note, "✓ נבדקה",
   the family stays open; "עוד פעולות" → "החזרה לרשימת הבדיקה" undoes it.
7. **Make main** — hover a copy: "הגדרה כראשית" → the ★ and ring move at once.
8. **A family with one variant and no media** — one card with "אין סרטון".
9. **Long English names** — wrap in the cards, are cut with an ellipsis in the rows.
10. **≤ 1000px / 390px** — the list only; a row opens the sheet from the reading-start side, the
    focus is on the family name; Esc or "→ חזרה לרשימה" closes it and the focus is back on the row;
    no sideways scroll; summary cards side by side; 2 variants per row; 64px tile.
11. **Keyboard only** — Tab through search, the four tabs, the chips, the rows (Enter opens), the
    issue chips and buttons, the variant cards' "הגדרה כראשית", "עוד פעולות".
12. **he ↔ en** — mirrored; the thumb slides the other way; English names stay left-to-right.
13. **Reduced motion** — no lift, no thumb slide, the sheet appears without sliding.

Checked here, in Chrome as the seed coach (scripted, after hit-testing the page's controls): 1;
2 (all four tabs, URL, the "נבדקו" empty state); 3; 4 (no results, then clear); 5 (Cobra: the "?"
tile, the grey panel, the save enabled after a pick — **not saved**); 6 (on Squat and V-Up: marked
reviewed, the note and status, the family stays open after leaving the list, then put back on the
list — the dev data ends as it started: 197 to review, 0 reviewed); 7 (made a copy the main one
of Squat's variant, then made the original main again); 10 in a 390px frame (sheet in, focus on
the title, Esc, focus back on the row, 2 per row, 64px tile, no sideways scroll).
**Not checked:** saving a pattern for an unclear family (it would change the dev library for good);
rename / split / merge (unchanged tools, now under "עוד פעולות"); 9 with a really long name; 11
with a real keyboard; 12 (English); 13; Safari / Firefox.

## Known issues / TODOs

1. The skipped items and the six decisions above; "איחוד ל־1" needs a server endpoint if wanted.
2. The header's "לבדיקה" number is re-read after each change and can lag a second behind.
3. The 26 pattern chips are a long sideways row; a group-level chip (the seven colors) would need
   the search to accept several patterns — it does (comma-separated), so this is an easy follow-up
   if you want group chips instead.
4. CLAUDE.md still describes the old review screen — say if you want it updated.
5. Not mine, left untouched: `apps/dashboard/src/features/trainees/copy/he.ts` (the attention card
   title was changed outside these rounds), `apps/dashboard/package.json`, `package-lock.json`,
   `apps/server/.env.example`, `packages/api-client/src/createApiClient.ts`,
   `docs/design/coach-dashboard.html`, `apps/mobile/**`.

## Suggested commits

The notifications-panel round is not committed yet either, and `tokens.css` holds the tokens of
both rounds — so the tokens go first, in one commit.

1. `feat(tokens): notifications panel and movement-pattern color tokens`
2. `feat(dashboard): notifications panel — typed cards, read / unread, 48h window alerts`
3. `feat(dashboard): exercise library redesign — pattern colors, status control, family detail`
4. `docs: notifications panel and exercise library reports`

```
git add -A -- packages/tokens/tokens.css apps/dashboard/src/styles/globals.css
git commit -m "feat(tokens): notifications panel and movement-pattern color tokens"

git add -A -- apps/dashboard/src/features/notifications
git commit -m "feat(dashboard): notifications panel — typed cards, read / unread, 48h window alerts"

git add -A -- apps/dashboard/src/features/exerciseLibrary apps/dashboard/src/app/router/AppRouter.tsx apps/dashboard/src/components/layout/PagePanel/PagePanel.tsx
git commit -m "feat(dashboard): exercise library redesign — pattern colors, status control, family detail"

git add -A -- docs/phase-reports/design-notifications-panel.md docs/phase-reports/design-exercise-library.md
git commit -m "docs: notifications panel and exercise library reports"
```
