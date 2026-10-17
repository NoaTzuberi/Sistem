# Design update — The publish modal: confirm → celebration (apps/dashboard)

Date: 2026-10-15. Reference: `docs/design/coach-dashboard.html` → בונה תוכניות → "פרסום למאיה"
(visual reference only; nothing was copied from its code).

## Summary

Publishing a workout plan or a nutrition plan no longer uses the browser's `confirm()`. One
reusable `PublishModal`, driven by `usePublishFlow`, asks "לפרסם ל[name]?" with a summary of what
she will get. It then calls the **existing** publish function of each builder, shows a spinner while
it runs, and keeps an inline error with retry if it fails. On success it shows a short celebration:
the circle pops in, the check draws itself, a ring expands, and one burst of confetti falls. The
plan builder's "published" toast is replaced by this celebration. The page's status updates exactly
as before (the editors apply the server's answer).

## The flow (`apps/dashboard/src/hooks/usePublishFlow.ts`)

`open()` → `confirm()` → `publish()` (the builder's existing function, resolving to true / false)
→ `done` or `failed`. Steps: `closed · confirm · publishing · failed · done`.

- **No double submit:** a second confirm while one is running does nothing (a ref guard, plus the
  button is `aria-disabled` and busy).
- **Closing waits:** Esc, "עוד לא" and the scrim are ignored while publishing.
- **Errors:** an error keeps the card on the confirm step with "הפרסום לא הצליח. נסי שוב."; the same
  button retries. It never closes silently.
- **Focus:** it returns to whatever opened the modal.

## The modal (`apps/dashboard/src/components/common/PublishModal/`)

- **Scrim:** `--color-modal-scrim` (ink 28%) with `--blur-modal-scrim` (12px), portaled to `<body>`.
- **Card:** `min(420px, 100%)`, radius 34, 94% white glass (`--surface-modal`), a pink / lilac / peach
  cloud at the top. It enters in 360 ms on `--ease-drawer`. At 390 px it has 16 px side margins and
  scrolls inside itself if it is ever taller than the screen.
- **Confirm step:**
  - an 84 px gradient avatar with a white ring and a small pink paper-plane badge;
  - "לפרסם ל[name]?" and "היא תקבל התראה ותראה את ה[תוכנית / תוכנית תזונה] מיד באפליקציה.";
  - a grey summary box:
    - **workout plan:** the split (if any) and the week's dates; chips for the workout count and
      the exercise count, then one chip per workout in its identity color (its tint, its readable
      solid color for the name, the name isolated);
    - **nutrition plan:** "תוכנית תזונה · X קק״ל ליום"; chips for the meal count and the day's
      protein / carbs / fat portions (from the meals as they are now);
  - a full-width pink "פרסום עכשיו" with the paper plane, and "עוד לא";
  - while publishing: a spinner and "מפרסם…" on pink-soft with Cherry Rose text.
- **Celebration step:**
  - a 96 px pink circle (pop 0.4 → 1 with a slight overshoot), a white check drawn with
    `stroke-dashoffset`, and a soft pink ring expanding behind it;
  - 28 confetti pieces in pink, lilac, orange and blue fly out and fall with gravity, over
    1.6–2.3 s, once;
  - a "פורסם" pill, "ה[תוכנית] בדרך ל[name]", and "שלחנו לה התראה עכשיו. אפשר לעקוב אחרי הביצוע בפרופיל שלה.";
  - "מעולה" closes; "לפרופיל של [name]" closes and opens her profile on Plans (workout plan) or
    Nutrition (nutrition plan).
- **Accessibility:**
  - `role="alertdialog"`, `aria-modal`, labelled by the title and described by the text, and
    `aria-busy` while publishing;
  - focus starts on the step's main button ("פרסום עכשיו", then "מעולה") and Tab stays inside.
- **Reduced motion:** no confetti, no pop, no draw, no ring — the check is simply there. The card
  appears without moving.
- **Her name** is isolated in every sentence, so a Latin name never reorders the Hebrew.

New tokens: `--color-modal-scrim`, `--surface-modal`, `--color-confetti-1…4`, `--blur-modal-scrim`,
`--transition-modal-in` (360ms). New icon: `send` (the paper plane).

## Where it is used

- **`planBuilder/components/PlanEditor`:** "פרסום" opens the modal; the flow runs the existing
  `publish` from `usePlanEditor` (saves first, then `publishPlan`).
- **`nutrition/components/NutritionEditor`:** "פרסום" opens the modal; the flow runs the existing
  `editor.publish` (saves first, then `publishNutritionPlan`). The header's publish button stays
  disabled while publishing, as before.

## Other `confirm()` / `alert()` calls — not changed (not publish-related)

Dashboard (`window.confirm`; there are no `alert()` calls):
- `nutrition/components/NutritionEditor.tsx` — replace meals with the AI draft; apply a template over meals
- `nutrition/components/MealCard/MealCard.tsx` — delete a meal that has portions
- `planBuilder/components/PlanEditor/PlanEditor.tsx` — replace workouts with the AI draft; clear the
  week; unpublish (two wordings); delete the plan
- `planBuilder/components/WorkoutCard/WorkoutCard.tsx` — change a workout's type; remove a workout
- `planBuilder/components/ExerciseRow/ExerciseRow.tsx` — back to simple sets
- `exerciseLibrary/components/FamilyTools/FamilyTools.tsx` — split / merge families
- `nutritionLibrary/hooks/useUnsavedChangesGuard.ts`, `nutritionLibrary/pages/FoodLibraryPage/FoodLibraryPage.tsx`
  — leave with unsaved changes, remove a food, delete a template (another session's work in progress)

The mobile app has none. The four untracked leftover folders
(`nutrition/components/{CalculationSummary,IntroEditor,MealEditor,TipsEditor}`) still contain old
publish `confirm()` calls, but nothing imports them — delete them.

## Copy (app copy `src/copy`, `publish.*`; he + en)

`title`, `textPlan`, `textNutrition`, `nutritionTitle`, `workouts`, `meals`, `now`, `notYet`,
`publishing`, `failed`, `published`, `doneTitlePlan`, `doneTitleNutrition`, `doneText`, `great`, `toProfile`
— the Hebrew is the design's wording. The old `publishConfirm` strings (planBuilder, nutrition) are no
longer used.

## Files

Added:
- `apps/dashboard/src/components/common/PublishModal/PublishModal.tsx`, `.css`
- `apps/dashboard/src/hooks/usePublishFlow.ts`
- this report

Modified:
- `apps/dashboard/src/features/planBuilder/components/PlanEditor/PlanEditor.tsx`
- `apps/dashboard/src/features/nutrition/components/NutritionEditor/NutritionEditor.tsx`
- `apps/dashboard/src/copy/he.ts`, `en.ts`
- `apps/dashboard/src/components/common/Icon/iconPaths.ts`
- `packages/tokens/tokens.css`

## How to test

```bash
npm run build     # passes
npm run lint      # passes (i18n and contrast audits clean)
npm test          # passes: server 42 files / 603 tests, copy + client 3 files / 31 tests
```

Checked in headless Chrome against the local server. **The publish call was mocked:** the first
attempt answered 500, later ones answered like the real API after 1.2 s, from a fresh GET. The
nutrition save was mocked the same way and every other write was blocked, so nothing was published
or saved in the dev database.

- **Workout plan:**
  - the confirm card ("3 אימונים · 20 תרגילים" and Full Body A / B / C chips); `role="alertdialog"`,
    focus on "פרסום עכשיו";
  - the first publish fails → inline error, card stays;
  - a double click on retry → one call (2 calls in total: the failure and the success);
  - loading shows "מפרסם…"; **Esc while loading is ignored**;
  - success → "פורסם", "התוכנית בדרך ל…", focus on "מעולה";
  - Tab stays inside; Esc closes.
- **Nutrition plan:** after a change, "תוכנית תזונה · 1,670 קק״ל ליום", "4 ארוחות · 4½ חלבון · 4 פחמימה ·
  4 שומן" → success → "לפרופיל" opens `?tab=nutrition`.
- **English, 390 px.**
- **Reduced motion:** confetti hidden, circle not animated.
- No console errors.

## Known issues / TODOs

1. **After a successful publish the "פרסום" button changes or disables**, so the focus cannot go back
   to it and lands on the page itself. After "עוד לא" it does return to the button.
2. **`NutritionEditor.tsx` also holds another session's uncommitted change** (`useTemplateHandoff`,
   which imports the untracked `nutrition/hooks/useTemplateHandoff.ts` and
   `nutritionLibrary/data/templateHandoff.ts`). Commit 2 below takes the whole file, so commit that work
   first or together — otherwise the dashboard will not build from a clean checkout.
3. **Not mine, not in these commits:** the nutrition library work (`nutritionLibrary/**`, the deleted
   nutrition pages, `AppRouter.tsx`, `SideSheet`, nutrition copy, `OptionPanel.css`).

## Suggested commits

1. `feat(dashboard): publish modal — confirm, then a celebration`
2. `feat(dashboard): plan and nutrition builders publish through the modal`
3. `docs: publish modal report`

```bash
git add -A -- apps/dashboard/src/components/common/PublishModal apps/dashboard/src/hooks/usePublishFlow.ts apps/dashboard/src/components/common/Icon/iconPaths.ts packages/tokens/tokens.css apps/dashboard/src/copy/he.ts apps/dashboard/src/copy/en.ts
git commit -m "feat(dashboard): publish modal — confirm, then a celebration"

git add -A -- apps/dashboard/src/features/planBuilder/components/PlanEditor/PlanEditor.tsx apps/dashboard/src/features/nutrition/components/NutritionEditor/NutritionEditor.tsx
git commit -m "feat(dashboard): plan and nutrition builders publish through the modal"

git add -A -- docs/phase-reports/design-publish-modal.md
git commit -m "docs: publish modal report"
```
