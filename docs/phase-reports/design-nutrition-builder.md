# Design update — Nutrition plan builder: full redesign (apps/dashboard)

Date: 2026-10-15. Reference: `docs/design/coach-dashboard.html` → "תפריטים" (visual reference
only; nothing was copied from its code).

## Read this first — the last commit does not build on its own

Commit `f9a7090` ("redesign coach dashboard…", already pushed) took this work half-way:
- it holds the new components and hooks, and deletes `CalculationSummary`, `IntroEditor`,
  `MealEditor` and `TipsEditor`;
- but it still has the old `NutritionEditor.tsx`, which imports those four.

A clean checkout of that commit — the GitHub Pages workflow, for one — fails the dashboard type-check.
I could not see the Actions result (no `gh` here); please check it.

On this machine it builds only because copies of the four deleted folders sit in the tree as
untracked files, dated 14 Oct 14:34, ten minutes after the commit. Nothing in this task created them.

The fix is commit 1 below: the finished `NutritionEditor` no longer imports them. I checked that
the dashboard builds with the four folders moved aside, and put them back. They are not used
anywhere now — **delete them** (they are not in any commit command):

```bash
rm -rf apps/dashboard/src/features/nutrition/components/{CalculationSummary,IntroEditor,MealEditor,TipsEditor}
```

## Summary

The builder is now three clear steps on the canvas (it left the white page panel):
1. **Calorie target** — her data, goal, the calculation as an equation, the daily target.
2. **Meals** — color-coded portion steppers, options, free vegetables.
3. **Message and tips.**

Around the steps:
- a sticky glass header with the autosave state and publish;
- step pills;
- a sticky sidebar with a live portion budget, the before-publish checklist, the AI draft, her
  preferences, and save as template.

Every existing feature is kept. All numbers come from the server's calculation and settings: kcal per
portion, goal %, the day's recommended portions and the floor.

## What each part does

1. **Header** (`BuilderHeader`)
   - Back button, her initials, "תוכנית תזונה · [name]".
   - Status pill: "טיוטה" (amber) or "פורסמה" (Cherry Rose), then "מעולם לא פורסמה" or the
     existing "גרסה N פורסמה …".
   - Autosave: "שומר…" → "נשמר ✓", or on failure "לא נשמר · ניסיון חוזר" (resends).
   - Publish (pink):
     - `aria-disabled` while required checks fail, with "N דברים לפני פרסום" beside it;
     - pressed while blocked, it scrolls to the first failing step and focuses its heading;
     - really disabled when nothing changed since the last version.
2. **Step pills** (`StepNav`): ① target [kcal] · ② meals [N] · ③ message and tips [N tips]. A check on
   Cherry Rose when done, else the number on pink. A press scrolls to the step, which stops under the
   sticky header (`--nb-header-offset`).
3. **Step 1** (`CalorieTargetSection`)
   - `HerDataFields`: soft tiles with label and unit, and a source tag ("מהשאלון · weight from her
     weigh-in on … · her timeframe ends …"). Sex is read-only (a formula select when she answered
     other / nothing). Activity is a select. Target weight and timeframe are marked "רשות".
     "Back to her data" and the "•" mark for the coach's own values are kept.
   - `GoalSegmented`: the 5 real goals (losing blue, keeping purple, gaining pink), with the coach's
     % from settings under each.
   - `CalcEquation`: BMR × activity = TDEE ± change % / kcal = recommended (the pink card, the largest
     number). Chips for weekly pace, expected timeframe and method. The unsafe-pace warning,
     timeline notes and "raised to the floor" are kept.
   - `DailyTarget`:
     - a big number with −/+ 50;
     - "שימוש בהצעה · X" when the target is unset;
     - when it differs from the suggestion: the difference and "חזרה ל־X";
     - the day's portions as colored chips with "≈ kcal · חלוקה מההגדרות";
     - the below-floor confirmation.
4. **Step 2** (`MealsSection`)
   - `TemplatePicker`: select + apply, in the step's header.
   - `MealCard`:
     - a colored strip and number badge;
     - an inline-editable name;
     - live kcal;
     - up / down / delete tools, faint until hover or focus and always shown on touch; delete
       asks first when the meal has portions;
     - `MealOptionTabs` (her option names, and "+ אפשרות", named "אפשרות א׳ / ב׳…");
     - `PortionStepper` pills in the group color, ½ steps, outlined and muted at 0 with − disabled;
     - `VegToggle`, an iOS switch in Cherry Rose.

     The open option's food items, text lines and food picker live in `OptionPanel`: all the
     existing option editing.
   - "+ ארוחה" is a dashed full-width tile.
5. **Step 3** (`MessageTipsSection`)
   - The textarea with a live "n / 1,500" (amber at the limit; also cut at 1,500 in code).
   - `MessagePreview`: a chat bubble on a phone-like card, "כך היא תראה את זה".
   - `TipsList`: warm rows, still editable, with delete, and an add field (Enter adds).
6. **Sidebar** (sticky; below the steps at ≤ 1180 px)
   - `PortionBudgetCard` (`aria-live="polite"`):
     - a ring of allocated kcal vs the target, with % and "X / Y קק״ל חולקו לארוחות";
     - a solid-pink alert listing what is missing (and any surplus), amber for surplus only,
       Cherry Rose "כל המנות חולקו בדיוק" when exact;
     - per group: allocated / target, a חסר / עודף / ✓ pill, and a bar (striped when over);
     - a snack line.
   - `PublishChecklist`: target set, at least one meal, meals valid, all portions given out, message
     (רשות). Each row scrolls to its step. The server's other notes are listed under it.
   - `AiDraftCard`: the existing AI nutrition card (generate, load, its reasoning once loaded) on a
     pink / lilac cloud.
   - `PreferencesCard`: her answers, or "היא לא ענתה על שאלות התזונה".
   - `SaveTemplateCard`: disabled until a name is typed (and while there are no meals).

**Hooks:**
- `useNutritionCalc`: the server's calculation, asked again as inputs change.
- `usePortionBudget`: live from the draft × the server's kcal per portion, against the target's
  recommended portions.
- `usePublishChecklist`.
- `useAutosave`: the timer, the save on leave, and the close-tab warning, now out of `useNutritionEditor`,
  which gained `retry`.

## Decisions I made — please check

1. **Which checks block publishing** — the server's own rules (`nutrition.validation`): a target
   (with the floor confirmed when below it), at least one meal, and no other publish error as of the
   last save. **"All portions given out" is advice (amber "!")**, because the server allows a plan
   that does not use the whole budget. Say if it should block.
2. **The goal control has 5 options, not 3**: the app has 5 goals (aggressive fat loss, fat loss,
   recomp, maintenance, muscle gain). Recomp sits with "keeping" (purple).
3. **The budget's target portions**:
   - target = the live suggestion → its portions at once;
   - any other target → the server's portions for it after the next autosave (about 1.5 s),
     with "החלוקה מתעדכנת אחרי השמירה…" meanwhile.

   Snack has no target (the calculation never adds snack portions), so it is its own line.
4. **The missing / surplus list uses the existing portion wording** ("חסרות 2 חלבון, ½ פחמימה"),
   not the reference's "2 מנות חלבון": that would need new plural forms.
5. **Meal kcal is live** (portions × the server's kcal per portion) instead of the last-saved value.
6. **Step 2 is done** when there is a meal, the meals are valid and every portion is given out.
   **Step 3 is done** when there is a message.
7. **New placeholder names are translated** ("ארוחה 5", "אפשרות ב׳"); they were English
   ("Meal 5", "Option B").

## Tokens (`packages/tokens/tokens.css`)

- **The portion map:** `--color-portion-{protein,carb,fat,snack}` + `-text` + `-soft`, with the brief's values.
- **Goal colors:** `--color-nb-goal-{loss,keep,gain}`.
- **Other colors:** `--color-nb-recommended-from|to`, `--color-nb-target-tint`, `--color-nb-tip`,
  `--color-nb-meal-ground`, `--color-nb-dash`, `--color-nb-switch-off`, `--color-nb-delete(-soft)`.
- **Header:** `--surface-nb-header`, `--blur-nb-header`, `--shadow-nb-header`.
- **Shadows:** `--shadow-nb-recommended`, `--shadow-nb-alert`, `--shadow-nb-meal-hover`.
- **Layout:** `--nb-header-offset`.

These are already in `f9a7090`; nothing new in this last step.

## i18n

`features/nutrition/copy`, `builder.*` (he + en; English is placeholder; lines marked PLACEHOLDER
wait for the owner). Added in this last step: `builder.methodGoal` and a changed
`builder.budgetAllocated` (`{amount}`, so "1,290 / 1,620" stays one left-to-right run in Hebrew).

## Files in this last step (everything else is in `f9a7090`)

Modified — `apps/dashboard/src/features/nutrition/`:
- `components/NutritionEditor/NutritionEditor.tsx`, `.css`: the new composition
- `components/CalcEquation/CalcEquation.tsx`: the % stays with its number in RTL
- `components/PortionBudgetCard/PortionBudgetCard.tsx`: the same for "allocated / target"
- `components/MessageTipsSection/MessageTipsSection.tsx`: the 1,500 cut
- `copy/he.ts`, `copy/en.ts`

Also mine, already committed in `f9a7090`: every component listed above, the hooks, `data/scrollToSection.ts`,
the tokens, `AppRouter.tsx` (the builder off the white panel) and the new icons (minus, arrowUp,
arrowDown, alert).

Not mine, left alone (other uncommitted work): `features/trainees/**` (profile photos, workout log
list, the profile page), `apps/mobile/**` (starting photo), and two reports in `docs/phase-reports/`.
`components/PreferencesPanel` is no longer used anywhere (the trainee tab has its own card);
deleting it is up to you.

## Dependencies

None added or removed.

## How to test

```bash
npm run build     # passes (and passes with the four leftover folders moved aside)
npm run lint      # passes; the i18n audit is clean
npm test          # passes: server 42 files / 601 tests, copy + client 3 files / 30 tests
npm run dev:all   # then a trainee → Nutrition → the builder
```

Checked in headless Chrome against the local server. **Every write was blocked by the test**, so
nothing reached the dev database (the log lists only the 2 blocked PUTs):

- **A fresh plan:** no target, 1 blocker, "use the suggestion" → 1,620 and the budget appears.
- **Targets:** a custom target shows "+100 מההצעה · חזרה ל־1,620".
- **A saved, published plan:** "פורסמה · גרסה 1 …", publish disabled, "nothing changed".
- **Under- and over-allocation:** a mixed alert, the עודף / חסר pills, a striped bar.
- **Autosave failure:** "לא נשמר · ניסיון חוזר".
- **A 1,503-character paste:** the count shows it, and the code now cuts it at 1,500.
- **0 meals:** 1 blocker; a press on publish scrolls to step 2 and focuses its heading.
- **Many meals with options:** 5 more meals, extra options.
- **No questionnaire answers:** the empty state.
- **English.**
- **390 px:** the header wraps, publish goes full width, the equation is 2 per row, the target stacks,
  the preview drops below — no horizontal scroll anywhere.
- **Keyboard:** Tab reaches back, the step pills and the fields in order.
- **Reduced motion:** no transitions on the steppers or the switch.
- No console errors.

Not checked:
- **Template apply** — the dev coach has no nutrition templates. The flow is the existing one: confirm, then apply.
- Safari, Firefox and a real touch device.

## Known issues / TODOs

1. `f9a7090` does not build on a clean checkout until commit 1 lands — see the top.
2. Delete the four untracked leftover folders and, if you like, `PreferencesPanel`.
3. "All portions given out" is advice, not a blocker (decision 1).

## Suggested commits

1. `fix(dashboard): nutrition builder — the editor uses the new steps (the last commit imported deleted files)`
2. `docs: nutrition builder design update report`

```bash
git add -A -- apps/dashboard/src/features/nutrition/components/NutritionEditor apps/dashboard/src/features/nutrition/components/CalcEquation/CalcEquation.tsx apps/dashboard/src/features/nutrition/components/PortionBudgetCard/PortionBudgetCard.tsx apps/dashboard/src/features/nutrition/components/MessageTipsSection/MessageTipsSection.tsx apps/dashboard/src/features/nutrition/copy/he.ts apps/dashboard/src/features/nutrition/copy/en.ts
git commit -m "fix(dashboard): nutrition builder — the editor uses the new steps (the last commit imported deleted files)"

git add -A -- docs/phase-reports/design-nutrition-builder.md
git commit -m "docs: nutrition builder design update report"
```
