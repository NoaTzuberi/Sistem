# Redesign — Trainee profile page (apps/dashboard)

Reference: `docs/design/coach-dashboard.html` → Trainees → a trainee → "פרופיל מלא" (look and
layout only — none of its names, answers, weeks or AI text were shipped).

## Summary

The trainee page (`/trainees/:id`) now sits on the dashboard canvas: a header card, her sections
as a pill segmented control, a redesigned Plans tab (AI draft card + start options when she has no
plans; week rows when she has) and a redesigned Questionnaire tab (answer cards). The other four
tabs keep their content inside one white card. Data, logic, routes, tabs, API and existing copy
are unchanged. **No server change** — the AI already writes in the coach's language (see below).
No dependency change.

## What changed

**Header card** (`TraineeHeader`)
- 84px avatar: her initials on the pink → Cherry Rose gradient (there is no trainee photo in our
  data).
- Name (36px, regular) + her status pill (the same tones as the trainees table) and "צריכה תוכנית
  לשבוע הבא" when it applies.
- Chips from her own onboarding answers: her goals, her days per week, and one amber "⚠" chip per
  recovery flag she ticked. A missing answer gives no chip.
- Email and time zone, small and muted, left-to-right.
- Side pill with a ring (`PlanWindowPill`): while she waits, the 48h window from the server's
  clock — "נותרו 34 שע׳ 12 דק׳" with the ring filling as the window is used; overdue = soft pink
  pill "באיחור של …" + "חלון 48 השעות עבר". Once she is active: "0 מתוך 1 · אימונים השבוע" (this
  week's published plan).
- One pink action: "בניית תוכנית" (not active) → the Plans tab with the week picker open;
  "לשבוע הבא" (active) → next week's plan in the builder when she has one, else the week picker.
- "→ כל המתאמנות" above.

**Tabs** (`TraineeTabs`) — the same six tabs and URLs, as a pill segmented control (white active
pill); ← → Home End move between them; the Plans tab shows its count.

**Plans tab — no plans yet**
- `AiPlanCard` (the pink cloud): "טיוטת AI מוכנה", a round refresh button, the recommended split
  large, the AI's summary cut to three lines, her workouts as pills in the workout colors, the
  "לבדוק איתה" items as a checklist, "פתיחה בבונה התוכניות", "אפשרויות חלוקה אחרות" and "טיוטה ·
  רק את רואה אותה". Without a draft the card shows the state (none / in progress / failed /
  unavailable) and "יצירת טיוטת AI".
- `PlanStartOptions` beside it: "תוכנית מאפס", "שכפול השבוע שעבר" (shown, not available, with
  "יהיה זמין אחרי התוכנית הראשונה") and the short note.

**Plans tab — with plans** — three soft pills (תוכנית חדשה · שכפול השבוע שעבר · טיוטת AI) and one
`PlanWeekRow` per plan: the week's first day large and light with its month, the plan's split (or
its size) with a status tag, the dates, this week's workout squares, and a round arrow into the
builder. Draft = grey, published = soft pink / Cherry Rose, ended = grey.

**Week picker** — the same component and rules, restyled as a white card.

**AI options** — "אפשרויות חלוקה אחרות", the refresh button and the "טיוטת AI" pill open the
existing AI draft side sheet (split cards, the AI's explanation, "regenerate for"). Its "use the
full plan" / "split only" open the week picker here, then the builder — the existing flow.

**Questionnaire tab** — a structured profile sheet (second round; it replaced the grid of
identical cards). See "Questionnaire tab — profile sheet" below.

**Other tabs** (nutrition, logs, body, achievements) — unchanged content on one white card.

## Questionnaire tab — profile sheet

Her existing onboarding answers, labels and option texts — rearranged, nothing asked or stored.
Which answer goes where is one file: `features/trainees/data/questionnaireProfile.ts`.

- **Key numbers** (`KeyNumbers`, top, white card): age (from her birth date), height, weight (her
  questionnaire weight), days a week — big light numbers with small units and thin dividers. Only
  the ones she gave.
- **"שימי לב לפני שבונים"** (`AttentionCard`, side column, amber): her recovery note ("הערה
  מהשאלון"), each recovery flag she ticked ("התאוששות"), and each allergy and intolerance with her
  own words about it ("אלרגיות" / "רגישויות"). Each is a white row with its source. Nothing to
  show = no card.
- **Sections** (`AnswerSection`, one white card each, plain titles), in this order:
  1. תזונה ומטרה — goals, weight goal, diet, diet style, religious, intolerances, allergies,
     loves, dislikes, meals a day;
  2. אימונים — days a week, flexible schedule, experience, preferred activities, equipment;
  3. העדפות תרגילים — muscle focus, favorite exercises, wants to improve;
  4. פרטים בסיסיים — name, birth date (formatted, with her age), gender, preferred units.
  Each is a definition list: the label in a quiet 160px column, the answer in medium weight.
  Multi-value answers are small pills.
- **Weight goal** (`WeightGoalBar`): her latest weigh-in (or her questionnaire weight when she has
  none later), the target, a progress bar from the questionnaire weight to the target, and under
  it what can be computed: "−6 ק״ג · 12 שבועות · כ-0.5 ק״ג בשבוע".
- **Empty answers** are not drawn. `MissingFieldsCard` in the side column says "6 שדות לא מולאו ·
  <names>" with "הצגת שדות ריקים"; pressed, the empty rows appear in their sections as faint
  "לא נענה", and the button becomes "הסתרת שדות ריקים". A section with nothing to show is not
  drawn at all.
- **"הושלם <date>"** (the existing line; or how far she got) under the side column.
- **Responsive**: under 1100px the side column goes above the sections; under 600px the key
  numbers are 2 × 2 and each row stacks (label over answer).

Questionnaire decisions — please check
1. **The weight-goal bar needs her latest weigh-in**, so the tab makes one extra request (the
   coach's existing body-metrics list) — only for a trainee who has a weight goal. Without a
   later weigh-in the bar sits at its start.
2. **Kg per week** = |target − questionnaire weight| ÷ the goal's weeks (for a target date: from
   the day she set the goal to that date). It is her own plan's arithmetic, not the nutrition
   builder's safe-rate calculation.
3. **Section titles are the existing ones**: "תזונה ומטרה", "העדפות תרגילים", "פרטים בסיסיים"; for
   training I used the existing "אימונים". The reference's "מטרות ותזונה" / "פרטים אישיים" would
   be new wording.
4. **Empty rows read "לא נענה"** (the existing shared text), not the reference's "לא צוין".
5. **What counts as empty**: an answer she did not give. "None" for allergies / intolerances and
   "אין העדפה" for meals a day are answers (she did the step) and are shown. A trainee who
   finished onboarding before the nutrition step existed has all of its rows listed as empty.
6. **Recovery is only in the amber card**, not in a section: no flags and no note simply means no
   card (ticking no flag is a valid answer), so recovery is never listed under "fields not
   filled in".
7. **Allergies and intolerances appear twice** — in the amber card and in their nutrition rows.
8. **Height and weight are key numbers**, so they have no row; a missing one is listed as empty
   and gets its row under "פרטים בסיסיים" when the empty fields are shown.
9. **The "hide empty fields" state** was added so the reveal can be undone (the reference's card
   just disappears).
10. **The age next to the birth date reads "גיל 36"** — neutral, since her gender answer can be
    anything; the reference's "בת 36" is feminine.

## Decisions I made — please check

1. **No "session length" chip.** The onboarding has no such question, so there is nothing to show.
2. **The amber chips are her recovery flags**, as she ticked them. Some are not injuries (e.g.
   "אני מעדיפה אימונים בעצימות נמוכה", "אני חוזרת אחרי הפסקה") — they are still things to see
   before building a plan, so they are shown the same way. Her free-text recovery note is not a
   chip (it can be long); it is in the Questionnaire tab, full width.
3. **Amber is a new color pair** (`--color-flag` / `--color-flag-soft`, the reference's values),
   used only for these chips. It is not a status color; the "no green" rule is untouched.
4. **Week rows show the week's first day, not a "week 7" number.** There is no program-week
   counter in our data (same as in the builder).
5. **Workout squares appear only on this week's published plan.** The coach's plan list carries no
   per-workout status; only the current week's comes with the dashboard's stats. Past weeks show
   none rather than guessed ones.
6. **"פתיחה בבונה התוכניות" first asks for the week** (the existing picker: a plan belongs to a
   week), then opens the builder with the draft loaded.
7. **The round refresh button opens the AI sheet** (where "יצירה מחדש" is), as in the reference —
   it does not start a new AI run on one press.
8. **The checklist ticks are local**: they reset when the tab is left. Nothing stores them.
9. **The AI summary is clamped to three lines** on the card (the drafts' summaries are two
   sentences; "one line" would cut most of them mid-sentence). The full text is in the AI sheet.
10. **With plans, the AI draft is one pill** ("טיוטת AI") that opens the sheet — the big card is
    only for a trainee without plans, as in the brief.
11. **Tab counts: plans only.** Logs and achievements would each need another request on every
    profile open; say if you want them.
12. **"הודעה" is omitted** — there is no messaging.

## Removed from the page

- The model / timestamp line ("gemini… · date"): the date is in the AI sheet's title line, the
  model and prompt version under "מה ה־AI קיבל" there.
- The long review warning on the page (it is in the AI sheet; the card says "טיוטה · רק את רואה
  אותה").
- The separate "regenerate for" row (it lives in the AI sheet).
- The whole "סיכום אימונים" section in the page (`TrainingSummaryCard`): its summary, experience
  read, considerations, split options and paths are the card + the sheet now.
- The email / time zone / 48h labels of the old header, and the old underline tabs.
- The old plans list ("פתיחה" links) → week rows.

## AI language

No change was needed. The training prompt already tells the model to write every coach-facing
text and the workout titles in the coach's language (`trainingPlanPrompt.ts`, in place since
Phase 15), and the drafts I looked at for the seed coach are in Hebrew. A draft generated while
the coach's language was English stays English until it is regenerated — stored drafts are not
translated.

## New tokens (`packages/tokens/tokens.css`)

`--color-flag`, `--color-flag-soft`, `--gradient-avatar`, `--gradient-profile-cloud`,
`--color-ring-track`, `--text-profile-name` (36px), `--shadow-avatar`.
Questionnaire round: `--surface-on-flag`, `--text-key-number` (32px). The amber of the attention
card is the `--color-flag` / `--color-flag-soft` pair added for the header chips.

## i18n keys (he + en; English is placeholder)

Added — `features/trainees/copy`: `backToAllTrainees`, `windowPassed`, `windowRunning`*,
`workoutsThisWeek`, `buildPlanShort`, `nextWeek`, `aiReadyTag`, `checkBeforeStart`,
`openInBuilder`, `otherSplits`, `draftOnlyYou`, `fromScratch`, `fromScratchHint`,
`duplicateAfterFirst`, `noPlansNote`, `planEnded`, `openWeek`*.
Questionnaire round: `age`, `ageYears`*, `attentionTitle`, `noteSource`, `missingFields`
(plural), `showEmptyFields`, `hideEmptyFields`*, `goalAtStart`*, `goalLatest`*, `goalTarget`,
`goalRate`.
\* = my placeholder wording; the rest is the reference's Hebrew.
Removed (unused now) — `features/trainees/copy`: `noPlans`, `backToTrainees`, `window48h`;
`features/aiDraft/copy` (`training.`): `summaryTitle`, `experience`, `useInNewPlan`,
`loadIntoPlan`, `loadingRunning`.

## Files

Added (each component = `.tsx` + `.css` in its own folder)
- `apps/dashboard/src/features/trainees/components/`: `TraineeHeader/`, `PlanWindowPill/`,
  `TraineeTabs/`, `PlanStartOptions/`, `PlanWeekRow/`; questionnaire round: `KeyNumbers/`,
  `AttentionCard/`, `AnswerSection/`, `WeightGoalBar/`, `MissingFieldsCard/`
- `apps/dashboard/src/features/trainees/hooks/`: `useTraineePlans.ts`, `usePlanCreation.ts`,
  `useLatestWeight.ts`
- `apps/dashboard/src/features/trainees/data/`: `traineeHeader.ts`, `questionnaireProfile.ts`
- `apps/dashboard/src/features/aiDraft/components/AiPlanCard/`
- `docs/phase-reports/design-trainee-profile.md`

Modified
- `packages/tokens/tokens.css`
- `apps/dashboard/src/app/router/AppRouter.tsx` (the trainee page left the white `PagePanel`),
  `components/layout/PagePanel/PagePanel.tsx` (comment), `components/common/Icon/iconPaths.ts`
  (`refresh`)
- `apps/dashboard/src/styles/globals.css` + `features/planBuilder/components/PlanEditor/PlanEditor.css`
  (the `.workout-color-N` classes moved to the global styles — the AI card uses them too)
- `features/trainees/pages/TraineeDetailPage/` (.tsx + .css), `components/TraineePlans/`
  (.tsx + .css), `components/OnboardingAnswers/` (.tsx + .css), `components/WeekPicker/`
  (.tsx + .css), `data/traineeTabs.ts`, `copy/he.ts`, `copy/en.ts`
- `features/aiDraft/copy/he.ts`, `copy/en.ts`
- Small fixes found on the way: `features/planBuilder/components/StartCards/StartCards.css`
  (cloud cards use `overflow: clip` — with `hidden` the oversized cloud made the card scrollable
  inside, so keyboard focus could scroll its content) and
  `features/planBuilder/components/SlotSection/SlotSection.tsx` (an empty ring drew a dot).

Deleted
- `features/trainees/components/TraineeStatusBadges/` (.tsx + .css) → `Tag` in the header
- `features/aiDraft/components/TrainingSummaryCard/` (.tsx + .css) → `AiPlanCard` + `AiDraftSheet`

## Dependencies

None added or removed by this work.

## How to test

```
npm run build -w @sistem/dashboard   # passes
npm run lint                         # passes (i18n audit clean; the known fast-refresh warnings)
npm run test:i18n                    # passes (29)
npm run dev:all                      # http://localhost:5174, seed coach: coach@sistem.dev
```

1. **Waiting trainee** (e.g. test10) — header: initials avatar, name + "ממתינה לתוכנית", the goal
   and days chips, an amber chip per recovery flag, email + time zone; the side pill counts down
   ("נותרו …", the ring fills); "בניית תוכנית".
2. **Overdue** (a trainee waiting more than 48h) — the pill is soft pink: "באיחור של …" / "חלון
   48 השעות עבר", the ring full and pink.
3. **Active trainee** (Dev Trainee Two) — the pill reads "X מתוך Y · אימונים השבוע"; the action is
   "לשבוע הבא" → her next-week plan in the builder (or the week picker when she has none).
4. **Tabs** — click each (instant, the URL's `?tab=` follows); focus one and use ← → Home End;
   "תוכניות" shows its count.
5. **Plans, no plans** — the AI card: tick the checklist; "אפשרויות חלוקה אחרות" and the round
   refresh button open the AI sheet (Esc closes, focus returns); "פתיחה בבונה התוכניות" → the week
   picker → create → the builder opens with the draft loaded; "תוכנית מאפס" → the week picker;
   "שכפול השבוע שעבר" is greyed with its reason. While the picker is open the other start actions
   wait.
6. **Plans, no AI draft** (a trainee whose draft failed / none) — the card shows the state and
   "יצירת טיוטת AI".
7. **Plans, with plans** — week rows newest first: date, split or size, tag (טיוטה / פורסמה /
   הסתיים), "השבוע" / "שבוע הבא", squares on this week's row, the arrow → that week in the
   builder; the three pills: תוכנית חדשה, שכפול השבוע שעבר (week picker in duplicate mode), טיוטת
   AI (the sheet → "use the full plan" → week picker → builder).
8. **From elsewhere** — the top line's "תוכנית חדשה" → pick her → her Plans tab with the picker
   open; the builder's ⋯ → "שכפול השבוע שעבר" → the picker in duplicate mode.
9. **Header pill from another tab** — on "שאלון" press "בניית תוכנית": the Plans tab opens with
   the picker; cancel, switch tab and come back: the picker does not reopen.
10. **Questionnaire** (Dev Trainee Two has every kind of answer):
    - the key numbers show age, height, weight, days a week; a trainee missing one shows fewer;
    - the amber card lists her recovery note, flags, allergies and intolerances with their source;
      a trainee with none of them has no amber card;
    - the four sections in order; goals, activities, equipment etc. as pills; the weight goal as
      a bar with "שקילה אחרונה … / יעד …" and the "−6 ק״ג · 12 שבועות · כ-0.5 ק״ג בשבוע" line;
      the birth date with her age;
    - no "—" anywhere; the side card says "N שדות לא מולאו · …"; "הצגת שדות ריקים" adds the empty
      rows ("לא נענה", faint) to their sections, "הסתרת שדות ריקים" removes them;
    - "הושלם …" under the side column; a trainee who has not started shows the existing line;
    - at 1000px wide the side column is above the sections and no longer sticky; at 390px the key
      numbers are 2 × 2 and each row's label is above its answer.
11. **Other tabs** — nutrition, logs, body, achievements: same content, on a white card.
12. **390px** (device toolbar) — the header stacks (avatar + name, then the pill and the action
    full width); the week rows lose their squares; no sideways page scroll.
13. **he ↔ en** — everything mirrors; email / time zone stay left-to-right.

Checked here, in Chrome as the seed coach (scripted clicks after hit-testing every control on the
page with `elementFromPoint` — none covered): 1, 3 (the pill and the label), 4, 5 (checklist,
sheet open / Esc, the picker opening from the card and from "תוכנית מאפס", cancel — no plan was
created), 7 (the rows, tags, squares and links read back; the pills present), 9, 11 (the card
wrapper), 12 in a 390px frame. Questionnaire round, on Dev Trainee Two: 10 at desktop width (key
numbers, sections and their rows, the amber card's five items, the goal bar's value and line, the
missing card and its toggle both ways) and in a 390px frame (side first, 2 × 2, stacked rows).
**Not checked:** in the questionnaire: a trainee without a weight goal / without attention items /
mid-onboarding, the 1100px breakpoint itself (only desktop and 390px), a goal with a target date;
2 (no overdue trainee was opened), 3's navigation, 6, 8, 13 (English / LTR —
the CSS is logical, but I did not look at it this round), creating a plan from the picker, real
pointer clicks, Safari / Firefox, the server test suite (no server file changed).
Nothing was written to the database in this round.

## Known issues / TODOs

1. The twelve decisions above and the ten questionnaire decisions.
2. The four untouched tabs keep their old sharp styling inside the white card.
   The mobile coach mode still shows the questionnaire through the shared `buildOnboardingSections`
   list — the profile sheet is dashboard-only.
3. A long AI summary is cut at three lines on the card with no "more" link — the sheet has all of it.
4. On a trainee with plans the AI draft's state (ready / failed / in progress) is not visible
   until the "טיוטת AI" pill is pressed.
5. `TraineeTabs` reuses the plan builder's `useTabListKeys` hook (a cross-feature import); move it
   to `src/hooks` if you prefer.
6. CLAUDE.md was not updated (it still describes `TrainingSummaryCard` and the old trainee page) —
   say if you want it brought up to date.
7. Not mine, left untouched and not in the commands below: `apps/dashboard/package.json` and
   `package-lock.json` (the `@dnd-kit` packages were removed there), `apps/server/.env.example`,
   `packages/api-client/src/createApiClient.ts`, `docs/design/coach-dashboard.html`.

## Suggested commits

The plan-builder rounds are still uncommitted (their commands are in
`docs/phase-reports/design-plan-builder.md`). This work builds on them — `AiDraftSheet`,
`PillButton`, `SideSheet`, the workout color tokens — so commit those first. Two of its files are
shared with this round: `packages/tokens/tokens.css` and the `features/aiDraft` / `features/planBuilder`
folders; committing the plan-builder commands now will therefore also pick up this round's edits
in those paths, which is fine (everything builds together). What is left for this round:

1. `feat(dashboard): trainee profile redesign — header card, pill tabs, plans and questionnaire tabs`
2. `docs: trainee profile design report`

```
git add -A -- apps/dashboard/src/features/trainees apps/dashboard/src/styles/globals.css apps/dashboard/src/app/router/AppRouter.tsx apps/dashboard/src/components/layout/PagePanel/PagePanel.tsx apps/dashboard/src/components/common/Icon/iconPaths.ts apps/dashboard/src/features/aiDraft apps/dashboard/src/features/planBuilder packages/tokens/tokens.css
git commit -m "feat(dashboard): trainee profile redesign — header card, pill tabs, plans and questionnaire tabs"

git add -A -- docs/phase-reports/design-trainee-profile.md
git commit -m "docs: trainee profile design report"
```
