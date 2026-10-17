# Design fix — settings card 5 + old-style fields sweep

Date: 2026-10-16 · Reference: `docs/design/coach-dashboard.html` (רשימות מזון → הגדרות → card 5), visual only.
No git write command was run.

## Summary

- Card 5 ("קצב, חלוקה וקטו") is rebuilt in the style of cards 1–4. It has three parts:
  - **Pace and safety:** four tinted stepper tiles (blue, pink, amber, neutral).
  - **Portion split:** a live 100% bar with a sum pill, a solid-pink "missing / over" alert, and the amber note.
  - **Keto:** one tile next to its explanation.
  - **Footer:** a "חזרה לברירות המחדל" pill that asks first in a designed dialog.
- Cards 1 and 5 now use one shared tile, `SettingsTile`, built on the same `SettingsStepper`. Every change feeds the live preview and the unsaved bar, as before.
- While the split isn't 100, saving is blocked. The unsaved bar shows the reason in place of "יש שינויים שלא נשמרו", and pressing Save shows it as a toast.
- Sweep: the dashboard now has a shared `Switch`, `Select` and `ConfirmDialog`, and a restyled `NumberField`. Every live checkbox, native select and square field in the dashboard uses them, apart from the exceptions listed below.
- The trainee app was left as is. See "Left native / not changed".

## Card 5 — what stayed the same

- **Fields, values and ranges:** loss % / week, gain % / week, largest deficit %, kcal per kg, the 4 split shares, and the keto carb portions.
- **Validation:** the same `validateSettings`. The split must total 100 within 0.01, and each value is checked against the server's ranges.
- **Steps:** 0.1 / 0.1 / 1 / 100 / split 1 / keto 0.5. The `SAFETY_FIELDS` steps were unchanged; the split and keto steps are new constants in `STEPS`.
- **Reset:** it still resets **every** setting to the server's defaults, as the old page-level button did, not only card 5 (the prototype resets only card 5's numbers). The form is dirty only if the result differs from what is saved: for a coach with no overrides, the bar does not appear.
- **Copy:**
  - "קצב ובטיחות", "חלוקת מנות", "קטו / דל פחמימות", the tile names / units, the alert lines, the hint and the keto line are the brief's wording.
  - "ל-100%" is written with ־, like the rest of the copy.
  - The old long labels stay as the steppers' screen-reader names.
  - Two keys, `portionSplit` and `portionSplitPlaceholder`, are replaced by `splitHint` (the brief's new note).
  - The card's title and subtitle are no longer marked PLACEHOLDER, because they are in the design now.
- **PLACEHOLDER copy:** the reset dialog's title and text (`resetTitle`, `resetText`). The design only shows that it asks.

## Files changed

**Added**
- `apps/dashboard/src/components/common/Switch/{Switch.tsx,Switch.css}`: the iOS switch, moved out of VegToggle. It has a press state and a disabled state.
- `apps/dashboard/src/components/common/Select/{Select.tsx,Select.css}`: a styled native select (pill + our chevron at the reading end). Variants: `soft` / `card` / `bare` (inside a field tile).
- `apps/dashboard/src/components/common/ConfirmDialog/{ConfirmDialog.tsx,ConfirmDialog.css}`:
  - a centered alert dialog;
  - in 300ms on the drawer curve, out in 200ms;
  - Esc or a scrim click cancels; Tab is trapped; focus starts on Cancel and returns to the opener;
  - reduced motion respected.
- `apps/dashboard/src/features/nutritionLibrary/components/SettingsTile/{SettingsTile.tsx,SettingsTile.css}`: the tinted tile (name, stepper, unit, error line). Tones: a portion group, or loss / gain / deficit / neutral.
- `apps/dashboard/src/features/nutritionLibrary/components/PortionSplitBar/{PortionSplitBar.tsx,PortionSplitBar.css}`: the 34px bar.
  - Each segment uses its group's `--solid-*` fill, because the white numbers need it.
  - The missing part is striped pink.
  - Over 100, the segments share the bar.
- `apps/dashboard/src/features/nutritionLibrary/hooks/usePortionSplit.ts`: the total, the segments and the missing / over message.

**Modified**
- Card 5: `nutritionLibrary/components/SettingsMore/*` (rebuilt).
- `SettingsKcalPerPortion/*`: now uses `SettingsTile`.
- `SettingsStepper.css`: the tile input is 64px at 18px, per the design; "7700" was clipped at 56px.
- `UnsavedChangesBar/*`: new optional `blockedReason`.
- `pages/FoodLibraryPage/*`:
  - the reset button moved into card 5;
  - the blocked reason goes to the bar and to a toast.
- `data/settingsForm.ts`:
  - steps for the split and keto;
  - a tone per safety field;
  - `splitTotal`.
- `copy/he.ts`, `copy/en.ts`.
- Food library: `FoodSheet/*` (category → `Select`, mark-as-new → `Switch`) and `FoodToolbar/*` (show-archive → `Switch`).
- `packages/tokens/tokens.css`: one token, `--gradient-split-gap`. This file also holds the publish-modal session's tokens; see the commit notes.
- **Sweep, dashboard:**
  - `components/common/NumberField/*`: was a square bordered box; now the soft rounded field, `dir="ltr"`.
  - `features/nutrition/components/VegToggle/*`: now a thin wrapper around `Switch`.
  - `features/auth/pages/Login/*`: remember-me checkbox → `Switch`. Still behind `REMEMBER_ME_ENABLED` and still not wired.
  - `features/aiDraft/components/AiDraftSheet/*`: the "regenerate for" select → `Select`.
  - `features/exerciseLibrary/components/FamilyTools/*`: member checkboxes → toggle rows (`aria-pressed`, a Cherry check mark).
  - `features/nutrition/components/DailyTarget/*`: "confirm below the floor" checkbox → `Switch`.
  - `features/nutrition/components/HerDataFields/*`: formula and activity selects → `Select variant="bare"` (they had the browser's arrow).
  - `features/planBuilder/components/ExerciseRow/*`: superset select → `Select`; interval checkbox → `Switch`.
  - `features/planBuilder/components/LibrarySheet/*`: level select → `Select`; "my equipment only" checkbox → `Switch`.
  - `features/planBuilder/components/SetTargetsTable/*`: set type select → `Select`.

## Left native / not changed (on purpose)

- **File inputs (trainee app):** `PumpPhotoField`, `ProgressPhotoSlot`, `StartingPhotoCard`, `MealPhotoField`, `StartingPhotoStep`. They are hidden and opened by our own buttons; they have to stay native to reach the camera and gallery.
- **Range input:** `ProgressPhotosCard` (dashboard). It is the before / after slider, styled to be the photo itself.
- **AI draft checklist:** `AiPlanCard` "check with her before starting". It keeps its native checkboxes with a pink accent, because the design (`.checks`) draws them that way, and a list of things to check is not an on / off setting.
- **Already in the new style:**
  - custom-styled inputs: OptionPanel's "counts as" select (the other session changes its CSS), the WorkoutHero chip selects / title / notes, the plan, exercise and nutrition message textareas, and all the search fields;
  - the steppers (cards 1–4, the mobile `NumberStepper`);
  - the activity factor inputs.
- **Unused (no file imports them):** `nutrition/components/{CalculationSummary,IntroEditor,TipsEditor,MealEditor}`. These still have the old square fields and native selects. I didn't restyle dead code, and I didn't delete it either. **Decision for you:** delete them?
- **Trainee app (mobile):** its shared `Input` / `Select` and two raw fields (coach trainees search, workout summary notes) use square bordered fields with `--radius-none`. That is the mobile app's own PRD §12 sharp-cut style, used the same way on every screen, and there is no mobile design reference in `docs/design/`. Restyling them would mean inventing a new look for the trainee app, so I left them. **Decision for you:** should the trainee app move to the dashboard's rounded soft fields? If yes, a mobile reference would let me do it in one pass.

## How to test

```bash
npm run lint          # oxlint + i18n audit + contrast audit — clean
npm test              # 603 server + 31 copy-parity — pass
npm run build -w @sistem/dashboard
```

Checked in the browser (coach, dev servers):
- **Split totals:**
  - 100: "✓ 100%" pill and the amber hint.
  - 98: pill "98% / 100%", alert "חסרים 2% כדי להגיע ל־100%", a 2% striped gap in the bar, and Save blocked with that line in the bar.
  - 103: "יש 3% מעל 100%", no gap.
- **Reset:**
  - Esc or Cancel leaves the values and returns focus to the button.
  - Confirm restores the defaults (100%, the hint is back).
- **Decimal step:** safe loss 1 → 1.1 with "+".
- **Keyboard typing:** typing in a split input updates the bar and the pill live.
- **English:** LTR, mirrored tiles and steppers.
- **390px:** tiles in a 2×2 grid, the keto tile stacked, no horizontal scroll, no clipped numbers.
- **Food sheet:** the category `Select` and the mark-as-new `Switch`.

Not checked in the browser:
- the plan builder's superset / set type / interval / library filters;
- FamilyTools;
- HerDataFields;
- the AI draft sheet.

These pass the typecheck and build; worth a quick look.

## Suggested commits

These fit into `docs/phase-reports/commit-plan.md`:
- Run that plan's commits **1 and 2** as written. Commit 1 adds all of `tokens.css`, which includes `--gradient-split-gap`.
- Then run the plan's `git add -p` step for `NutritionEditor.tsx`.
- Then run **A, B, C, D below in place of the plan's commit 3**. Its file list misses the new files above, so it would not build.
- Then continue with the plan's commits 4–7.

A — feat(dashboard): shared Switch, Select and ConfirmDialog; soft NumberField
- `apps/dashboard/src/components/common/{Switch,Select,ConfirmDialog,NumberField}`, `apps/dashboard/src/features/nutrition/components/VegToggle`

B — feat(nutrition): nutrition library with settings card 5 (the plan's commit 3 + card 5)
- `apps/dashboard/src/features/nutritionLibrary`, `useTemplateHandoff.ts`, nutrition copy, the deleted old pages / FoodForm / NutritionSubnav / PagePanel, `AppRouter.tsx`

C — refactor(dashboard): old checkboxes and native selects → Switch / Select
- Login, AiDraftSheet, FamilyTools, DailyTarget, HerDataFields, ExerciseRow, LibrarySheet, SetTargetsTable

D — docs: this report

```bash
git add -A -- apps/dashboard/src/components/common/Switch apps/dashboard/src/components/common/Select apps/dashboard/src/components/common/ConfirmDialog apps/dashboard/src/components/common/NumberField apps/dashboard/src/features/nutrition/components/VegToggle
git commit -m "feat(dashboard): shared Switch, Select and ConfirmDialog; soft NumberField" -m "- Switch: the iOS switch (Cherry Rose on), moved out of VegToggle
- Select: native select in a pill with our chevron (soft / card / bare)
- ConfirmDialog: designed confirm instead of window.confirm, focus trapped and returned
- NumberField: soft rounded field, numbers left to right"

git add -A -- apps/dashboard/src/features/nutritionLibrary apps/dashboard/src/features/nutrition/hooks/useTemplateHandoff.ts apps/dashboard/src/features/nutrition/copy/he.ts apps/dashboard/src/features/nutrition/copy/en.ts apps/dashboard/src/features/nutrition/pages apps/dashboard/src/features/nutrition/components/FoodForm apps/dashboard/src/features/nutrition/components/NutritionSubnav apps/dashboard/src/components/layout/PagePanel apps/dashboard/src/app/router/AppRouter.tsx
git commit -m "feat(nutrition): nutrition library — food sheet, templates, live settings" -m "- One page for foods, templates and settings (tab in the path), off the white panel
- Food sheet with field messages and a contains picker; templates grid and rename
- Settings cards with shared steppers / tiles and a live preview; unsaved-changes bar
- Card 5: pace tiles, live portion-split bar (save blocked until 100), keto tile, reset with a confirm dialog
- Template handoff into the builder; old food list / templates / settings pages removed"

git add -A -- apps/dashboard/src/features/auth/pages/Login apps/dashboard/src/features/aiDraft/components/AiDraftSheet apps/dashboard/src/features/exerciseLibrary/components/FamilyTools apps/dashboard/src/features/nutrition/components/DailyTarget apps/dashboard/src/features/nutrition/components/HerDataFields apps/dashboard/src/features/planBuilder/components/ExerciseRow apps/dashboard/src/features/planBuilder/components/LibrarySheet apps/dashboard/src/features/planBuilder/components/SetTargetsTable
git commit -m "refactor(dashboard): old checkboxes and native selects use the shared Switch / Select" -m "- Remember me, below-floor confirm, interval, my-equipment-only → Switch
- Split-off members → toggle rows; regenerate-for, formula, activity, superset, set type, level → Select"

git add -A -- docs/phase-reports/design-settings-card5-and-fields.md
git commit -m "docs: settings card 5 and fields sweep report"
```
