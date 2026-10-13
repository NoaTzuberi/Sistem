# Fix + redesign — Plan Builder (apps/dashboard) — through v3

Reference: `docs/design/coach-dashboard.html` → "בונה תוכניות" (v3; look, layout and
motion only — none of its trainee, exercises, numbers or AI text were shipped).

This report covers the three rounds together and describes the page as it is now: round 1
(day-card strip, permanent library column, volume card, AI card) and the v2 workout band / one-line
rows are superseded. The newest round is the **v3** section right below.

## v3 — the selected workout "feels alive"

Only the presentation of the selected workout changed; data, slots, rules, copy, API and the rest
of the page (header, ⋯ menu, workout pills, start cards, AI sheet) are as in v2.

- **Hero band** (`WorkoutHero`): a soft cloud in the workout's own color (two blurred blobs of
  the workout token at 55% and 28% via `color-mix`, over its soft variant — no new hex values).
  Row 1: dot, the editable title (30px, regular, tight), a small transparent "⋯". Row 2: chips —
  day select, workout-type select (no browser arrow, their own small chevron, 32px, white 80%)
  and "+ הערה לאימון" / "הערה לאימון ✓", which opens the notes field inside the band (white 85%).
  The always-visible workout notes field is gone. Row 3: exercises · sets · ~minutes in big light
  numbers, and at the far end the chips of the slots that already have an exercise.
- **Slots** (`SlotSection`): each slot is a soft rounded container with a small progress ring
  (filled / max, workout color), its name, "חובה" (workout color) or "רשות" (white), the count,
  and "+ הוספה" while there is room. An empty slot shows a dashed line. The AI's suggestion for
  an empty slot still sits inside it.
- **"+ הוספה" on a slot opens the library sheet on that slot** (title line "אל: {workout} ·
  {slot}"): only that slot's families, her equipment only (as the old slot picker did), the
  slot's own pattern pills, "בשימוש לאחרונה", and "הצגת כל התרגילים" to drop the slot filter.
  The exercise goes into that slot. A full slot has no "+ הוספה"; adding to it anyway (the sheet
  is still open when the slot fills up) is refused with the toast "הסלוט מלא".
- **Exercise cards**: a 56px tile (see "no media" below), the name with "muscle · weight" under
  it, and at the far end the big spec "3 × 12–15" (the × in the workout color) with a clock + the
  rest under it, and a chevron that turns up when the card opens (200ms ease-out). The whole
  card is the toggle (click / Enter / Space); the "עריכה" links are gone. Open: the same four
  fields, reps ↔ time, superset, interval, per-set targets, ↑ ↓, notes, and הסרת התרגיל · החלפת
  וריאציה · סיום — unchanged behaviour.
- **390px**: the stats spread over the width and the slot chips wrap under them; cards use a 48px
  tile and an 18px spec, no chevron; the four fields stay 2 × 2.

v3 decisions — please check
1. **No exercise has an image** (the library is facts only), so every card shows the fallback
   tile: a gradient in the workout's color with an icon. A superset shows its letter there.
2. **The inline slot picker (`SlotPicker`) is deleted**; the library sheet took over its filters
   (slot, her equipment, level, recently used, show all). Lost with it: its typo-tolerant search
   inside a slot (the sheet searches on the server, like the general library) and its ↑ ↓ / Enter
   list keyboard. The sheet loads 20 at a time, so a slot opens faster than before.
3. **Slot maximum is now enforced when adding to a slot** ("הסלוט מלא"). Before, "+ הוספה" could
   put a third exercise into a 2-max slot. The bottom "+ הוספת תרגיל" still adds anything: a typed
   workout puts it in the first slot with room that fits it, else under "אחר".
4. **The bottom "+ הוספת תרגיל" stays** (the reference only has the per-slot buttons): a free
   workout has no slots, and "אחר" needs a way in.
5. **Minutes** are an estimate on the client: sets × (40 s, or the set's own seconds, + its rest;
   60 s when the rest is empty). Display only.
6. **Wording**: the new texts say "סלוט" as in the brief ("הסלוט מלא", "עוד אין תרגיל בסלוט הזה");
   older texts on the page still say "משבצת" ("משבצת חובה אחת ריקה", "חזרה לתרגילי המשבצת"). Pick
   one and I will align them.
7. **The hover shadow of a card switches without a transition** (the rule is transform / opacity
   transitions only).
8. The brief mentions a "two calm rows" header fix; no such change was in the working tree — v3
   went straight on top of v2.

## Summary

Step A: the dead buttons had one real cause — an invisible layer over the first screen of the
page — which is fixed and now guarded by a test. Step B: the builder was rebuilt to the simpler
reference: a header with two controls, one colored pill per workout, one workout card, and two side sheets (exercise library, AI draft). v3 then gave
the selected workout its hero band, slot containers and exercise cards. No
server, API, schema or dependency change; the same `usePlanEditor` / `planDraft.ts` state.

## Step A — why the buttons did not respond

Reproduced in Chrome on a scratch draft with `document.elementFromPoint` at each control's
center, then with real pointer clicks.

1. **An invisible overlay swallowed the clicks (the root cause).**
   Small pill buttons (`PillButton` size `sm`) have a `::after` layer that enlarges their touch
   target (`position: absolute; inset: -6px 0`). While tidying the CSS I removed the
   `position: relative` that anchors that layer to its own button. Unanchored, each small pill's
   layer stretched over the whole first screen-height of the page, on top of everything.
   `elementFromPoint` on "פרסום", the trainee pill, the day cards and "שכפול השבוע שעבר" all
   returned a small `.pill-button` instead of the control. Everything in the first screen was
   dead to the pointer (header, days, the first exercise rows with their ×, the AI card);
   controls further down worked after scrolling, which is why it looked random. My first check
   used scripted `.click()` calls, which skip hit-testing — that is how I missed it.
   **Fix:** `position: relative` is back on `.pill-button` (with a comment saying why).
   **Guard:** `scripts/plan-builder.test.ts` fails if any absolutely positioned `::before` /
   `::after` in the dashboard's CSS has an unpositioned host (verified: it fails on the old CSS).
2. **"צפייה" on the AI card looked dead even when its click arrived.** It toggled the AI
   explanation panel inside the page, above the workout editor — usually off screen — and on a
   plan that was already loaded from a draft the panel started open, so the first click *closed*
   it. Nothing visible happened next to the button. **Fix:** the AI draft now opens in a side
   sheet, in front of the coach.
3. **The AI buttons looked disabled.** They were not (`disabled` was false in the DOM); the
   translucent "glass" style on the pink cloud read as greyed out. "החלה על השבוע" was also
   absent on a published plan with no hint. **Fix:** the sheet uses the normal solid pink / soft
   pills; on a published plan the load buttons are visibly disabled.
4. **Handlers / console.** No unwired handler, no `<button>` inside a `<label>` or `<form>`, and
   no console error on click were found.

Tests added (`npm run test:i18n`, also part of `npm test`): remove exercise → that row is gone
and the others keep their order; apply AI draft → the plan's workouts are replaced, the plan is
linked to the draft, its notes stay, nothing carries a server id; the CSS overlay guard.
There is still no browser test setup in the repo, so the clicks themselves are covered by the
checklist below, not by automated tests.

## Step B — what the page is now

- **Header:** trainee pill · week title (large, light) · status pill ("טיוטה · נשמר"; published =
  soft pink with a Cherry Rose dot) · a round "⋯" menu · ONE pink pill. On a draft the pill is
  "פרסום ל{name}"; on a published plan it is "שמירת השינויים" (a published plan is live, so it
  is still never autosaved).
- **⋯ menu:** שכפול השבוע שעבר · טיוטת AI · שמירת טיוטה (draft) / ביטול פרסום (published) ·
  ניקוי השבוע · מחיקה. Grows from its button (150ms ease-out), closes on outside press and Esc
  (focus back on the button), ↑ ↓ Home End move between items.
- **Empty week:** three start cards — שכפול השבוע שעבר (the week picker in duplicate mode), טיוטת
  AI (the pink cloud card → the AI sheet), מאפס (a first empty workout).
- **Workouts row:** one pill per workout in plan order (color dot, name, "day · exercises · sets"),
  the selected one filled with its color; a dashed "+ אימון" last. ← → Home End switch workouts.
  A workout with no day, or sharing a day, is fine — the day is chosen inside the workout.
- **Workout card, exercises, adding:** see the v3 section above.
- **AI draft sheet:** split options as radio cards (title, "מומלץ" / "הבחירה שלך" and "יש תוכנית"
  tags, the why; + / − only on the selected card), the existing review note, the AI's explanation
  (collapsed), and the footer: "שימוש בתוכנית ה-AI המלאה" (pink), the compact "יצירה מחדש עבור"
  select, "שימוש בחלוקה בלבד" and "יצירה מחדש". Both load paths fill the *editable* plan (with
  the existing replace confirm) — nothing publishes.
- **Workout colors:** five identity colors by the workout's place in the plan, cycling; visual
  only, never stored.

## Removed / simplified (nothing is unreachable)

| Was on the page | Now |
|---|---|
| Day-card strip with rest days | The workouts row; the day is a select inside the workout |
| Permanent library column | The library sheet behind "+ הוספת תרגיל" |
| Weekly volume-balance card | Removed (as asked) |
| AI card + the AI explanation section in the page | The AI sheet (⋯ → טיוטת AI, or the start card) |
| Header buttons: duplicate week, save draft, unpublish, delete | The ⋯ menu |
| "Type of the new workout" select + "+ הוספת אימון" | "+ אימון" adds a free workout; the type is the select in its band |
| Workout buttons ↑ ↓ שכפול הסרה | The band's ⋯ menu |
| Chip "split" | Removed (the split is in the AI sheet); the minutes are back as a big number on the hero band |
| Exercise drag handle | ↑ ↓ inside the open card (as asked) |
| The inline slot picker, and the "all exercises" picker of a free workout | The library sheet (opened on the slot, or on everything) |
| The always-visible workout notes field | The "+ הערה לאימון" chip on the hero band |
| The line "drafts are saved automatically" | The status pill says it |

## Decisions I made — please check

1. **"Load from template" is not in the menu.** The dashboard has no training-template screen or
   API calls (only nutrition templates), so there is nothing existing to run. Not built.
2. **"ניקוי השבוע"** is new but tiny: it empties the plan's workouts in the editor (after a
   confirm) and the normal save rules apply. It shows the start cards again.
3. **"יצירה מחדש"** in the AI sheet builds for the split in the "עבור" select; when a split
   option without a plan is selected (and the select is on "ה-AI בוחר") the button reads "יצירת
   תוכנית לחלוקה הזו" and builds for that option — the same two actions as before, in one button.
4. **The AI note** uses the existing review wording, not the reference's shorter line.
5. **"החלפת וריאציה · {current variant}"** opens the existing variant + history panel inside the
   open card.
6. *(superseded by v3 decision 1.)*
7. **White text on the orange and blue workout pills** is ~2.9:1 and ~3.3:1 — the colors are the
   brief's; fine for the pill's medium-weight name, weak for its small line. Say if you want
   darker shades.
8. **Published plan:** the load buttons in the AI sheet are disabled (as before: drafts only).
9. `SideSheet` copies the trainee drawer's shell; `TraineeDrawer` itself was not touched.

## New tokens (`packages/tokens/tokens.css`)

Workout identity colors: `--color-workout-1` #FF006E / `-1-soft` #FFE3EF · `-2` #7C4DFF / #EEE7FF ·
`-3` #FF7A00 / #FFEEDD · `-4` #0094FF / #E0F1FF · `-5` #A50047 / #F8E1EA, plus
`--surface-on-workout`, `--surface-on-workout-strong`, `--color-on-workout-muted`.
v3: `--text-hero-title` (30px), `--shadow-exercise`, `--shadow-exercise-hover`,
`--transition-chevron` (200ms).
Others: `--radius-field` (12px), `--ring-field`, `--shadow-menu`, `--transition-menu` (150ms),
`--transition-toast` (200ms), `--z-toast`, `--breakpoint-builder-rows` (720px).

## i18n keys — `features/planBuilder/copy` (he + en; English is placeholder)

Added: `switchTrainee`, `moreActions`, `publishTo`, `clearWeek`, `clearWeekConfirm`*,
`workoutsOfWeek`, `addWorkoutShort`, `workoutActions`*, `workoutHasIssues`*, `dayCounts`, `all`,
`emptyWorkout`, `startDuplicateHint`, `startAiHint`, `startScratch`, `startScratchHint`, `done`,
`removeExercise`, `swapVariant`, `addExercise`, `addExerciseTitle`, `addExerciseTo`,
`addExerciseToSlot`, `toastAdded`, `toastRemoved`, `toastDuplicated`*, `toastPublished`,
`toastAiLoaded`, `toastSplitLoaded`, `summarySets`, `summarySeconds`, `summaryWeight`;
v3: `addWorkoutNote`, `workoutNoteSet`, `statExercises`, `statMinutes`, `slotOptional`,
`slotFull`, `slotEmpty`, `secondsShort`.
\* = my placeholder wording; the rest is the reference's / the brief's Hebrew (`startAiHint`
without its "3").
Removed (unused now): `show`, `hide`, `libraryTarget`, `addExercisesHere`, `add`, `library`,
`addingTo`, `addWorkoutFirst`, `draftNote`, `noWorkouts`, `addWorkout`, `newWorkoutType`,
`variantAndHistory`, `dragNamed`; with the slot picker: `pickerTitle`, `pickerAllTitle`,
`pickerEmpty`, `pickerHint`, `pickerClose`, `pickerResults`, `pickerLoadError`, `notForHer`.
`features/aiDraft/copy`: unchanged.

## Files (compared with the last commit)

Added (each component = `.tsx` + `.css` in its own folder)
- `apps/dashboard/src/components/common/`: `PillButton/`, `ActionMenu/`, `SideSheet/`, `Toast/`
- `apps/dashboard/src/hooks/useToast.ts`
- `apps/dashboard/src/features/planBuilder/components/`: `BuilderHeader/`, `TraineePicker/`,
  `StatusPill/`, `StartCards/`, `WorkoutTabs/`, `WorkoutHero/` (v3), `SlotSection/` (v3),
  `ExerciseField/`, `LibrarySheet/`
- `apps/dashboard/src/features/planBuilder/hooks/`: `useExerciseLibrary.ts`, `usePopover.ts`,
  `useTabListKeys.ts`
- `apps/dashboard/src/features/planBuilder/data/`: `planStats.ts`, `workoutColors.ts`,
  `workoutTabs.ts`
- `apps/dashboard/src/features/aiDraft/components/AiDraftSheet/`, `aiDraft/hooks/useSplitChoice.ts`
- `scripts/plan-builder.test.ts`

Modified
- `packages/tokens/tokens.css`, `vitest.i18n.config.mts` (runs the new test)
- `apps/dashboard/src/app/config/routes.ts` (`DUPLICATE_WEEK_STATE`), `app/router/AppRouter.tsx`
  (the builder left the white `PagePanel`), `components/layout/PagePanel/PagePanel.tsx` (comment),
  `components/common/Icon/iconPaths.ts`
- `features/planBuilder/components/`: `PlanEditor/`, `WorkoutCard/`, `ExerciseRow/`,
  `SetTargetsTable/` (.tsx + .css each), `VariantPanel/VariantPanel.css`
- `features/planBuilder/pages/PlanBuilderPage/` (.tsx + .css), `planDraft.ts` (`removeExercise`),
  `data/planDefaults.ts`, `data/familyFacts.ts`, `copy/he.ts`, `copy/en.ts`
- `features/aiDraft/aiDraftToPlan.ts` (`applyAiDraft`), `aiDraft/components/AiRationalePanel/`
  (.tsx + .css)
- `features/trainees/components/TraineePlans/TraineePlans.tsx` (opens the picker in duplicate mode)

Deleted
- `features/planBuilder/components/ExerciseLibrary/` (.tsx + .css) → `LibrarySheet`
- `features/planBuilder/components/DragHandle/` (.tsx + .css), `hooks/useSortSensors.ts`
- `features/planBuilder/components/SlotPicker/` (.tsx + .css) → the library sheet's slot mode (v3)

Kept: `SaveIndicator` (the nutrition builder uses it); `Button` / `Badge` / `NumberField` (other
screens; `NumberField` is still inside the per-set table).

## Dependencies

None added or removed. `@dnd-kit/*` is no longer imported anywhere in the dashboard (the plan
builder was its only user) — say if you want it removed from `apps/dashboard/package.json`.

## How to test

```
npm run build -w @sistem/dashboard   # passes
npm run lint                         # passes (i18n audit clean; the known fast-refresh warnings)
npm run test:i18n                    # passes: 29 (5 new, scripts/plan-builder.test.ts)
npm run dev:all                      # http://localhost:5174, seed coach: coach@sistem.dev
```

Click-through (Trainees → Dev Trainee Two → Plans → open a draft):

1. **Nothing is covered.** Click things in the first screen with the mouse: the trainee pill, ⋯,
   the pink pill, a workout pill, the first exercise.
2. **Trainee pill** → the list → another trainee → her Plans tab.
3. **Workouts row** — click pills (instant); focus one and use ← → Home End; "+ אימון" adds
   "אימון N" in the next color.
4. **Hero band** — rename (the pill's name follows); day chip → another day / "בלי יום" (the
   pill's line follows); type chip (confirm when it has exercises; the slots change); "+ הערה
   לאימון" opens the notes field with the cursor in it, type → the chip reads "הערה לאימון ✓",
   press it again to tuck the field away; the three numbers follow the edits; the slot chips at
   the far end match the slots that have exercises; ⋯ → move / שכפול / הסרה (toasts).
5. **Exercise card** — click a card: it opens, the chevron turns up, the cursor is in the weight;
   type a weight: "· 22.5 ק״ג" appears under the name; change sets / reps: the big spec follows;
   click another card: the first closes; Tab to a card + Enter / Space; "סיום" closes.
6. **Delete exercise** — open a card → "הסרת התרגיל": the card is gone, the slot's ring and count
   drop, toast "הוסר: …".
7. **Variant** — open a card → "החלפת וריאציה · …" → pick another variant → the name changes.
8. **More in the open card** — חזרות ↔ זמן (the spec shows "3 × 40 שנ׳"), the "to" number of a reps
   range, סופרסט (its letter replaces the tile's icon), אינטרוולים (timed), יעדים לכל סט ↔ חזרה
   לפשוט, ↑ ↓, notes.
9. **Add to a slot** — "+ הוספה" on a slot: the sheet opens with "אל: {workout} · {slot}", only
   that slot's exercises, "רק הציוד שלה" ticked; press a row → toast "נוסף: …", the ring fills;
   when the slot is full its "+ הוספה" disappears, and one more press in the sheet gives "הסלוט
   מלא" and adds nothing; "הצגת כל התרגילים" ↔ "חזרה לתרגילי המשבצת"; a "בשימוש לאחרונה" pill
   adds too; "סיום" or Esc closes and the focus is back where it was.
10. **Add anything** — "+ הוספת תרגיל" at the bottom: the general library; in a typed workout the
    exercise lands in the first slot it fits, else under "אחר". An empty slot shows the dashed
    line "עוד אין תרגיל בסלוט הזה"; "שימוש" on an AI suggestion fills it.
11. **⋯ menu** — opens from the button; ↑ ↓; Esc closes with the focus on ⋯; a press outside closes.
12. **AI draft** — ⋯ → טיוטת AI: select the option cards (only the selected shows + / −; ↑ ↓ move);
    with option 1 "שימוש בתוכנית ה-AI המלאה" → confirm → the workouts are replaced, toast, status
    "טיוטה"; open again → "שימוש בחלוקה בלבד" → empty typed workouts with AI suggestions; with
    another option the pink pill is disabled and the soft one reads "יצירת תוכנית לחלוקה הזו";
    the "ההסבר של ה־AI" section opens. Nothing is published by any of them.
13. **Clear week** — ⋯ → ניקוי השבוע → confirm → the three start cards; try each card.
14. **Duplicate week** — ⋯ → שכפול השבוע שעבר → the Plans tab with the week picker in duplicate mode.
15. **Publish** — "פרסום ל…" → confirm → the pill turns soft pink "פורסמה · נשמר", toast, the
    trainee gets the existing notification; the pink pill becomes "שמירת השינויים" (enabled after
    an edit); ⋯ → ביטול פרסום.
16. **Validation** — publish a workout with an empty required slot: the error box, "יש מה לתקן" on
    the workout's pill, the messages on the rows (also while closed).
17. **Delete plan** — ⋯ → מחיקה → confirm → back to the Plans tab.
18. **390px** (device toolbar) — the hero's stats spread and its slot chips wrap; cards have the
    smaller tile and spec and no chevron; the four fields are 2 × 2; both ⋯ menus and both sheets
    stay inside the screen; no sideways page scroll.
19. **he ↔ en** — everything mirrors; the sheet comes from the other side; ← → follow the screen.
20. **Reduced motion** (DevTools → Rendering) — sheets and the menu appear without moving; no
    press scale.

Checked here, in Chrome as the seed coach on scratch draft plans (created for each check, deleted
afterwards). All of it with hit-testing first (`elementFromPoint` on every control of the builder
— none covered, in v2 and again in v3) and `window.confirm` answered automatically.
- **v3 round** (scripted clicks): 4 (note chip incl. focus and the ✓; stats and slot chips read
  back), 5 (open, one at a time, focus in the weight, chevron turns, the under-line and spec
  follow, "סיום"), 9 (slot mode, add, ring / count, button hidden when full, "הסלוט מלא", show
  all), 18 in a 390px frame, 19.
- **v2 round** (real pointer clicks for opening a row, "הסרת התרגיל", "+ הוספת תרגיל", a library
  row, ⋯ and its "טיוטת AI"; scripted for the rest): 3, 6, 7 (the panel opens), 10 (the general
  library, an AI suggestion), 11, 12 (full plan, split only, option cards), 13 (clear → cards →
  the AI card), 14, 15 (publish, unpublish).
**Not checked:** 2 beyond opening the list; 8 (the secondary controls of an open card — their
code is unchanged); 16 (validation display); 17 (delete plan); 20 (reduced motion); in v3: real
pointer clicks (scripted only, after the hit-test), the type chip, the hero's ⋯ actions (its menu
opening was checked), "בשימוש לאחרונה", a superset's letter on the tile, a workout with per-set
targets on a card; the "duplicate" and "from scratch" start cards; the sheet / menu / chevron
animations watched live; "יצירה מחדש" itself (it would spend an AI call); Safari / Firefox; a plan
with more than five workouts; the server test suite (no server file changed).
Side effects of the checks on the dev database: the seed trainee received one "plan published"
notification for a scratch plan (v2 round); the seed coach's language was switched to English and
back (each round).

## Known issues / TODOs

1. The eight v3 decisions and the nine v2 decisions above (template loading is the one action
   from the briefs that is missing).
2. The slot-filtered library request is slow on a large slot (a few seconds before the first
   rows appear — the server request itself, unchanged).
3. Leaving a **published** plan with unsaved changes through an in-app link (trainee pill,
   duplicate week, back link) drops them without asking; the browser only asks on tab close.
4. In English, a Hebrew workout title in the band's input is right-aligned (the field follows its
   text's direction).
5. Muscle names (under an exercise's name, in the library rows, in the open card) are still the
   English ids, as before — more visible now that the card shows one.
6. CLAUDE.md still names the old components (`WorkoutCard` as the stacked card, `ExerciseLibrary`,
   `SlotPicker`, @dnd-kit reordering) — say if you want it brought up to date.
7. Unrelated uncommitted work was left untouched and is not in the commands below:
   `apps/mobile/src/features/onboarding/**`, `packages/api-client/src/createApiClient.ts`,
   `scripts/api-client.test.ts`, `docs/design/coach-dashboard.html`.
   `vitest.i18n.config.mts` already had an uncommitted change (the api-client test line); my one
   line is in the same file, so commit 4 below takes both.

## Suggested commits

Nothing of the three rounds is committed yet, so the commands cover all of it.

1. `feat(tokens): workout identity colors and plan builder tokens`
2. `feat(dashboard): pill button, action menu, side sheet and toast`
3. `feat(dashboard): plan builder redesign — workout tabs, hero band, slots, exercise cards, library and AI sheets`
4. `test(dashboard): plan builder state and CSS overlay guard`
5. `docs: plan builder fix + redesign report`

```
git add -A -- packages/tokens/tokens.css
git commit -m "feat(tokens): workout identity colors and plan builder tokens"

git add -A -- apps/dashboard/src/components/common/PillButton apps/dashboard/src/components/common/ActionMenu apps/dashboard/src/components/common/SideSheet apps/dashboard/src/components/common/Toast apps/dashboard/src/components/common/Icon/iconPaths.ts apps/dashboard/src/hooks/useToast.ts
git commit -m "feat(dashboard): pill button, action menu, side sheet and toast"

git add -A -- apps/dashboard/src/features/planBuilder apps/dashboard/src/features/aiDraft apps/dashboard/src/features/trainees/components/TraineePlans/TraineePlans.tsx apps/dashboard/src/app/config/routes.ts apps/dashboard/src/app/router/AppRouter.tsx apps/dashboard/src/components/layout/PagePanel/PagePanel.tsx
git commit -m "feat(dashboard): plan builder redesign — workout tabs, hero band, slots, exercise cards, library and AI sheets"

git add -A -- scripts/plan-builder.test.ts vitest.i18n.config.mts
git commit -m "test(dashboard): plan builder state and CSS overlay guard"

git add -A -- docs/phase-reports/design-plan-builder.md
git commit -m "docs: plan builder fix + redesign report"
```

Commit 4's `vitest.i18n.config.mts` lists `scripts/api-client.test.ts`, which is still untracked:
commit that file (your earlier work) before or together with it, or `npm test` fails on a clean
checkout.
