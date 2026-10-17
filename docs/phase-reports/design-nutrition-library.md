# Design update — Nutrition library: food list · templates · settings (apps/dashboard + a small server addition)

Date: 2026-10-15. Reference: `docs/design/coach-dashboard.html` → "רשימות מזון" (visual reference only; nothing was
copied from its code).

## Summary

`/nutrition/foods`, `/nutrition/templates` and `/nutrition/settings` are now one page, `FoodLibraryPage`
(new feature folder `features/nutritionLibrary`). It sits on the canvas (no white panel). It has:
- the title "תזונה · ספרייה" with a subtitle;
- an iOS segmented control (sliding thumb, counts). The open tab is the route, so it is kept in the URL;
- three "how it works" glass cards at the top of the food list and templates tabs.

Every existing behavior is kept: group / category / name / portion / grams / kcal / contains / "new", archive vs
delete (decided by the server), restore, the per-group caps, templates saved and applied in the builder, and every
settings number (including the 13a+ pace / split / keto numbers). The old pages, `FoodForm`, `NutritionSubnav` and
the now-unused `PagePanel` layout are deleted.

**Already committed:** the owner committed part of this work mid-task in `013776c design updates`. That commit has
the server endpoints and tests, types / api-client, the hooks, the data files, copy, and the first components
(LibraryTabs, HowItWorks, GroupChips, FoodToolbar, FoodGroupSection, FoodCard). The commands below cover only
what is still uncommitted.

## What each tab does

1. **Food list**
   - **Chips:** "כל הקבוצות" (charcoal when chosen), then one chip per group with its dot and count (tinted with a
     ring when chosen). When a group is chosen, the existing category chips appear under them (kept from the old page).
   - **Toolbar:**
     - a search pill over name + category (`searchByText`, typo-tolerant);
     - the iOS switch "הצגת ארכיון";
     - a pink "+ פריט מזון".
   - **Sections per group:** a dot, the cap pill ("עד 150 קק״ל למנה" / "חופשי"), and the count.
   - **Food cards:** an auto-fill grid with a 220px minimum. Each card has:
     - a colored strip and a category tag;
     - a charcoal "חדש" pill, or an "בארכיון" tag;
     - the name and the portion;
     - grams and kcal, plus a kcal-vs-cap bar;
     - the "מכיל" tags, or "ללא רכיבים מסומנים".
   - **Warnings:** a missing kcal shows "· חסר" in amber, and kcal over the cap shows "· מעל המכסה". Either gives
     the card an amber hairline.
   - **Hover:** the card lifts 3px. The edit and remove / restore buttons fade in on hover, and are always shown on
     touch and when focus is inside the card.
   - **Removing:** remove asks first (new), then the server deletes or archives as before. Restore stays.
   - **The sheet:** add and edit open a side sheet (`FoodSheet`, built on the shared `SideSheet`). It has:
     - a 5-segment colored group picker;
     - name, category, portion, grams and kcal. The kcal field shows "מתוך [cap]" and turns amber with a line when
       over the cap; vegetables are "חופשי", with kcal disabled as before;
     - "מכיל" toggle chips (charcoal when on) with the hint;
     - the "לסמן כחדש" switch.
   - **Sheet footer:** "ביטול" + pink "הוספה לרשימה" / "שמירה". Save stays pink-soft with cherry text until both
     name and portion are filled, since the server requires both.
   - **Sheet behavior:** Esc and the scrim close it, focus is trapped and returns to what opened it, and the scrim
     blurs the page.
2. **Templates**
   - **Cards:** each has:
     - a gradient icon tile, the name (and description if any);
     - the meal count · day kcal;
     - colored chips with the day's portions per group;
     - "עודכנה [date]";
     - "שימוש לתוכנית חדשה" (a soft pill that turns pink on hover);
     - rename and delete icons on hover (always shown on touch / focus). Delete asks first.
   - **"Use for a new plan":** asks "לאיזו מתאמנת?" in a sheet with a search, then opens her builder. The builder
     applies the template through its existing "start from a template" flow, so it still asks first when her meals
     have content.
   - **Empty state:** a pastel illustration, the owner's two lines, and "פתיחת בונה התזונה" (the same trainee
     sheet → her builder).
3. **Settings** — two columns: the cards, and a sticky live preview (the preview moves under the cards at ≤1100px).
   - **Card layout:** each card has a charcoal numbered badge, a title and a one-line explanation.
   - **The five cards:**
     1. kcal per portion: 4 tinted tiles with −/+ (±10);
     2. goal adjustment: a scale (blue minus / pink plus, one marker per goal), then a row per goal, tinted blue or
        pink, with −/+ (±1) and an LTR %-input;
     3. activity factor: 7 columns, each a number over a purple bar (scaleY), with "N ימים";
     4. safety floor: one large stepper (±50);
     5. **pace, split and keto** (not in the design): the 13a+ numbers the old page had, kept so nothing is lost.
   - **Range checks:** every field is checked against the server's ranges, with inline amber messages (for
     example, factor 1–2.5, a whole floor 800–2,500, a split that sums to 100).
   - **"חזרה לברירות המחדל":** kept from the old page.
   - **Live preview "כך זה ישפיע":** a fixed example trainee (60 kg, 165 cm, 30, 3 days, recomp). It shows the
     daily kcal (large), "raised to the floor" when that happens, and the portion chips, then the existing
     "changes apply from now" note.
   - **How the preview is calculated:** by the real calculator on the server (see below), 250 ms after the last
     change. While a field is invalid it keeps the last answer and says so.
   - **Unsaved changes:**
     - a sticky glass bar slides up ("יש שינויים שלא נשמרו" + "ביטול" + pink "שמירת ההגדרות");
     - leaving the settings tab, clicking a link to another page, or closing / reloading the tab asks first.
   - **After saving:** the food list's caps are read again.

## Server (additive, no schema change) — committed in 013776c

- **`POST /api/coach/nutrition/settings/preview`** runs unsaved settings through `suggestCalorieTarget`, the same
  calculation the builder's suggestion uses, on `SETTINGS_PREVIEW_SAMPLE` (nutrition.config.ts). Nothing is stored,
  the same payload rules as PUT apply, and a bad value gets a 400.
- **`PATCH /api/coach/nutrition/templates/:templateId` `{ name }`** renames a template: only hers, name required.
- Types: `RenameNutritionTemplatePayload`. api-client: `previewNutritionSettings`, `renameNutritionTemplate`.
- Tests: the preview (1,840 kcal for the sample, raised to a floor above TDEE, 400 when invalid, nothing saved);
  rename (another coach gets 404, an empty name gets 400, the name changes and nothing else does); trainee
  authorization (403).

## Decisions I made — please check

- **The calculator stays on the server.** "Reuse the real calculator" was done with a preview endpoint, not by
  copying the math into the client (plan / nutrition rules are server-only).
- **The example trainee** is the prototype's (60 kg, 165 cm, age 30, 3 days, recomp), stored as a server constant.
- **Card 5 "קצב, חלוקה וקטו"** is not in the design; its title and line are PLACEHOLDER copy.
- **"Use for a new plan"** asks for the trainee in a sheet. The "לאיזו מתאמנת?" sheet's lines are PLACEHOLDER.
- **"שומשה N פעמים" is not shown:** templates have no usage count (no invented data). "עודכנה" uses `updatedAt`.
- **The design's "archive" icon** keeps the old remove behavior: the server deletes an unused item and archives a
  used one, and the confirm says so. Archived items get a restore icon.
- **The sheet opens on the far side from the sidebar** (the left in Hebrew), like every dashboard sheet and the
  prototype.
- **Leaving with unsaved settings:** the dashboard router isn't a data router, so links are caught on click and
  the tab close / reload with `beforeunload`. The browser Back button is not caught.
- **Small shared changes:**
  - `SideSheet` got an opt-in `blurScrim`;
  - new icons: pencil, archive, swap, filter, download, template, info;
  - new tokens: the vegetable group colors (`--color-portion-vegetable*`), the amber card ring, the goal-scale and
    row tints, the activity bar and template tile gradients, the preview cloud;
  - global `.food-group-*` classes set each group's three colors.
- **Class names are scoped.** Two collisions were found and renamed: `goal-row` (Statistics) became
  `settings-goal-*`, and `trainee-picker-*` (plan builder) became `template-trainee-*`.

## Files

Added (uncommitted):
- `apps/dashboard/src/features/nutritionLibrary/pages/FoodLibraryPage/` (tsx + css)
- `apps/dashboard/src/features/nutritionLibrary/components/` — FoodSheet, ContainsPicker, TemplatesGrid,
  TemplateCard, TraineePickerSheet, TemplateRenameSheet, SettingsCard, SettingsStepper, FieldMessage,
  SettingsKcalPerPortion, SettingsGoalAdjustments, SettingsActivityMultipliers, SettingsSafetyFloor, SettingsMore,
  SettingsLivePreview, UnsavedChangesBar (each tsx + css)
- `apps/dashboard/src/features/nutritionLibrary/data/templateHandoff.ts`
- `apps/dashboard/src/features/nutrition/hooks/useTemplateHandoff.ts`
- `docs/phase-reports/design-nutrition-library.md`

Modified (uncommitted):
- `apps/dashboard/src/app/router/AppRouter.tsx` — the three routes → FoodLibraryPage, no PagePanel
- `apps/dashboard/src/components/common/SideSheet/SideSheet.{tsx,css}` — `blurScrim`
- `apps/dashboard/src/features/nutrition/components/NutritionEditor/NutritionEditor.tsx` — applies a handed-off template
- `apps/dashboard/src/features/nutrition/copy/{he,en}.ts` — 44 keys used only by the deleted pages removed
- `apps/dashboard/src/features/nutritionLibrary/{components/LibraryTabs/LibraryTabs.tsx,copy/he.ts,copy/en.ts,data/libraryTabs.ts}`
- (the new tokens, icons and `.food-group-*` classes are already in 013776c)

Deleted:
- `apps/dashboard/src/features/nutrition/pages/{FoodListPage,NutritionTemplatesPage,NutritionSettingsPage}/`
- `apps/dashboard/src/features/nutrition/components/{FoodForm,NutritionSubnav}/`
- `apps/dashboard/src/components/layout/PagePanel/`

Not mine — left untouched and not in the commits below (another session's work in progress):
- `apps/dashboard/src/components/common/PublishModal/`
- `apps/dashboard/src/hooks/usePublishFlow.ts`
- `apps/dashboard/src/features/planBuilder/components/PlanEditor/PlanEditor.tsx`
- `apps/dashboard/src/copy/{he,en}.ts`
- `apps/dashboard/src/features/nutrition/components/OptionPanel/OptionPanel.css`
- `packages/tokens/tokens.css` (publish-modal tokens) and the `send` icon in `iconPaths.ts`

## Dependencies

None added or removed.

## How to test

- **Commands:** `npm test` (server 603 + i18n parity 31, all pass), `npm run lint` (oxlint, i18n audit and contrast
  audit are clean), `npm run build` (passes; the chunk-size warning was already there).
- **Manual** (`npm run dev:all`, sign in as coach@sistem.dev → sidebar "רשימת מזון"). Checked in the browser:
  - missing-kcal cards are amber;
  - the add sheet: the over-cap kcal turns amber with a line; Esc closes it and focus returns to "+ פריט מזון";
  - settings: a −10 step moves the preview (protein 5½ → 6) and shows the bar; Cancel restores;
  - a floor of 500 shows "מספר שלם בין 800 ל־2,500", Save goes pink-soft and the preview asks for a fix;
  - English / LTR;
  - 390px: no horizontal scroll on any tab, kcal tiles 2×2, the preview under the cards;
  - the templates empty state.
- **Not yet checked in the browser:**
  - with many templates: rename, delete, and use → pick a trainee → her builder applies it. The dev database has
    no templates; rename is covered by the API test;
  - keyboard only: arrows / Home / End on the tabs, Tab through the cards (actions appear on focus), Esc on sheets;
  - reduced motion (every transition and animation has a `prefers-reduced-motion` off switch).
- **Still to try by hand:**
  - a food over its cap: set a kcal in the sheet, then lower its group's value in settings — the server refuses
    with "N items are above the new value" (409);
  - search with no results → "לא נמצא מזון"; the vegetables chip → "חופשי"; the archive switch.

## Known issues / TODOs

- The browser Back button doesn't ask about unsaved settings (no data router).
- The "use count" on template cards waits for data (not tracked).
- Wording to confirm: card 5 and the trainee-picker lines (PLACEHOLDER); the English copy is a draft.

## Suggested commits

```bash
git add -A -- apps/dashboard/src/components/common/SideSheet
git commit -m "feat(dashboard): side sheet can blur the page behind its scrim"

git add -A -- apps/dashboard/src/features/nutritionLibrary apps/dashboard/src/features/nutrition/hooks/useTemplateHandoff.ts apps/dashboard/src/features/nutrition/components/NutritionEditor/NutritionEditor.tsx apps/dashboard/src/features/nutrition/copy/he.ts apps/dashboard/src/features/nutrition/copy/en.ts apps/dashboard/src/features/nutrition/pages apps/dashboard/src/features/nutrition/components/FoodForm apps/dashboard/src/features/nutrition/components/NutritionSubnav apps/dashboard/src/components/layout/PagePanel apps/dashboard/src/app/router/AppRouter.tsx
git commit -m "feat(dashboard): nutrition library redesign — food sheet, templates grid, settings with live preview"

git add -A -- docs/phase-reports/design-nutrition-library.md
git commit -m "docs: nutrition library redesign report"
```
