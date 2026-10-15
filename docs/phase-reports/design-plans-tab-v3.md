# Design update — Trainee profile → Plans tab v3: week rail, week calendar, consistency (apps/dashboard)

Date: 2026-10-15. Reference: `docs/design/coach-dashboard.html` → מאיה כהן → תוכניות (visual reference
only; nothing was copied from its code).

## Summary

For a trainee with plans, the Plans tab is now:
1. **A rail of her program's weeks.** Each shows its number, dates, a mini bar per workout and its
   state. The selection is kept in the URL (`?week=`).
2. **The selected week as a two-column hero:** its facts and completion ring beside a 7-day calendar
   of her workouts — or, for an empty week, three big ways to start it.
3. **"התמדה לאורך התוכנית":** four numbers and a column per week.

The toolbar, the new-plan popover, the AI sheet and the no-plans start screen are unchanged. The
server's plan list now also says how each published week went: done / planned / skipped, judged by
the same rule as her own app.

## What each part does

1. **Week rail** (`WeekRail`, `WeekRailItem`)
   - **Which weeks:** from the week of her first plan to the last planned week (or this week),
     every week once, plus one empty week after it. N = week N of her program.
   - **Each item:** "שבוע N", the dates, and a bar per workout in its identity color — filled when
     done, tinted when planned, striped when skipped.
   - **State labels:**
     - past: completion %;
     - this week: a pink "השבוע" pill;
     - a draft: "טיוטה" in amber, outlined card;
     - empty: "ריק" with a pink "+", dashed card;
     - a later published week: "פורסמה".
   - **Selected:** white, a 2 px pink ring and a pink shadow. The default is this week. Hover lifts 2 px.
   - **Keyboard:** `role="tablist"`; ← → Home End move in reading order and select (the shared
     `useTabListKeys`). The selected week stays in view.
2. **Week hero** (`WeekHero`, `WeekInfo`, `WeekCalendar`, `CalendarDay`, `CalendarWorkout`)
   - **The card:** radius 30, with a cloud by state (pink this week / later, amber draft, lilac past).
   - **Info:**
     - "שבוע N" and a state pill (פורסם · פעיל / טיוטה · לא פורסם / הסתיים);
     - the plan's name (its split, else its dates — plans have no title of their own), at 30 px light;
     - "dates · N אימונים";
     - a 124 px ring with "%" and "x מתוך y בוצעו". A draft shows "—" and "עוד לא התחיל", and the
       ring draws no stroke at 0.
     - A draft also gets the existing amber "עוד לא פורסם. [name] לא תראה אותו עד שתפרסמי." plus
       "מתחיל בעוד N ימים".
   - **Actions:**
     - this week: "פתיחה בבונה" (pink) + "שכפול לשבוע הבא";
     - a draft: "המשך עריכה ופרסום";
     - a past week: "צפייה בבונה";
     - a later published week: "פתיחה בבונה".
   - **Calendar:**
     - 7 day columns, Sunday first, so they run right → left in Hebrew;
     - today tinted pink with "היום";
     - each workout on its day: a top strip and tint in its identity color, its name (isolated), the
       exercise count, and a status chip:
       - בוצע ✓ — white text on the workout's solid color, never on its tint;
       - מתוכנן — white chip;
       - דולג — striped block;
       - טיוטה — outlined block.

       Hover lifts 3 px with a colored shadow; a press opens the plan in the builder.
     - Days without a workout: dashed "מנוחה".
     - Workouts without a set day are listed after the days under "בלי יום קבוע". A week with no
       fixed days at all shows only that list.
3. **Empty week** (`EmptyWeekStarts`)
   - A calendar icon tile, "שבוע N עדיין ריק", the dates and "אפשר להכין אותו מראש".
   - **Three cards:**
     - מאפס;
     - שכפול שבוע [N−1], with that week's workout count and status (disabled when it has no plan);
     - טיוטת AI, with a gradient icon and "טיוטת AI מוכנה" when a draft is ready.

     Each opens the existing new-plan popover **on that week** (the popover got a `week` option)
     and that method.
   - A past week with no plan only says so: plans cannot be made for weeks that are over.
4. **Consistency** (`ConsistencyCard`)
   - **Chips:** שבועות בתוכנית, ביצוע ממוצע, שבועות מלאים, אימונים שבוצעו — tinted, each number in its
     readable solid color.
   - **Chart:** one column per published week up to this one — solid pink gradient at 100%, striped
     for this week, light pink otherwise — with the % on top and "שבוע N" under it. Hover brightens
     the bar; a press selects that week and scrolls to the hero.

**Hooks:** `useTraineeWeeks` (the weeks) and `useSelectedWeek` (URL `?week=`, falling back to this week).

## Server (read-only, no schema change)

`GET /api/coach/trainees/:id/plans` (the list only) adds `progress` to each published plan:
`{ statuses: { workoutId: done | upcoming | missed }, completed, planned }`.

- Statuses come from the existing `resolveWorkoutStatus` (planStatus.ts), as of today in her zone.
- done = a completed log for that workout.
- Drafts get none.
- Type: `CoachPlanProgress` in `@sistem/types`. There is 1 new test.

## Decisions I made — please check

1. **Program weeks:** week 1 is the week of her first plan. Weeks inside the program without a plan
   appear as empty items. One empty week follows the last planned week (or this week).
2. **"ביצוע ממוצע" and "שבועות מלאים" count ended weeks only.** "שבועות בתוכנית" and
   "אימונים שבוצעו" include this week.
3. **The chart shows published weeks up to this one**; drafts and later weeks have no completion yet.
4. **Clicking a calendar workout opens the plan in the builder.** The builder has no way to open on a
   given workout yet, so it opens on its usual first tab.

## Left out — no existing action or data

- **"שימוש כבסיס" on a past week:** the only duplicate action copies the week right before the new
  plan's week, and plans cannot be made for past weeks, so a week further back cannot be reused.
  "צפייה בבונה" is there.

## Copy (`features/trainees/copy`, `weeks.*`; he + en, English is placeholder; PLACEHOLDER lines wait for the owner)

`railLabel`, `week`, `empty`, `newWeek`, `statusLive`, `statusDraft`, `statusEnded`, `workoutsCount`,
`doneOf`, `notStarted`, `startsIn`, `duplicateToNext`, `viewInBuilder`, `today`, `rest`, `skipped`,
`noFixedDay`, `calendarLabel`, `emptyTitle`, `emptyHint`, `emptyPast`, `duplicateWeek`,
`consistencyTitle`, `weeksInPlan`, `averageDone`, `fullWeeks`, `workoutsDone`, `chartLabel`.

Reused: `thisWeek`, `continueAndPublish`, `openInBuilderShort`, `notPublishedNote`, `startScratch`,
`aiReadyTag`, `workoutDone`, `workoutPlanned`, `shared.coach.planStatus`, `shared.coach.exerciseCount`.

## Files

Added — `apps/dashboard/src/features/trainees/`:
- `components/`: WeekRail, WeekRailItem, WeekHero, WeekInfo, WeekCalendar, CalendarDay, CalendarWorkout,
  EmptyWeekStarts, ConsistencyCard (each `.tsx` + `.css`)
- `hooks/useTraineeWeeks.ts`, `hooks/useSelectedWeek.ts`
- `docs/phase-reports/design-plans-tab-v3.md`

Modified:
- `features/trainees/components/TraineePlans/TraineePlans.tsx`
- `features/trainees/hooks/useNewPlanPopover.ts` (`week` option)
- `features/trainees/data/planWeeks.ts` (the unused week split removed)
- `features/trainees/copy/he.ts`, `en.ts`
- `packages/types/src/index.ts`
- `apps/server/src/features/plans/planBuilder.service.ts`, `__tests__/planBuilder.test.ts`

Deleted:
- `features/trainees/components/ThisWeekCard`, `NextWeekCard`, `WeekTimeline`

`PlansToolbar` is unchanged by this task. Its CSS, and many other CSS files, `package.json` and
`scripts/contrast-audit.mjs`, are another session's contrast work — not in these commits.

## Dependencies

None added or removed.

## How to test

```bash
npm run build     # passes
npm run lint      # passes (i18n audit and the new contrast audit clean)
npm test          # passes: server 42 files / 602 tests (1 new), copy + client 3 files / 30 tests
npm run dev:all   # trainee → תוכניות
```

Checked in headless Chrome against the local server, with all writes blocked (none were attempted).
The dev trainee's real plans cover:
- **a past week with skips:** week 1, 0%, both "דולג";
- **a fully done week:** week 2, 100%, four "בוצע ✓";
- **this week with no fixed days:** week 3, listed under "בלי יום קבוע";
- **two drafts ahead:** "—", "עוד לא התחיל", outlined blocks;
- **the empty slot:** week 6.

What was verified:
- **URL:** `?week=` changes with the selection and reopens it.
- **Keyboard:** ← in Hebrew selects the next week.
- **Empty week:** "מאפס" opens the popover with that week (1–7 Nov) preselected.
- **Chart:** a press selects week 1 and scrolls to it.
- **Stats:** 3 weeks / 50% / 1 full / 4 done.
- **Sizes and language:** 390 px and 1024 px with no horizontal page scroll (the rail and calendar
  scroll inside), and English.
- **Reduced motion:** transitions are off.
- No console errors.

Not checked: a week with 5+ workouts and a trainee with a single week (no such dev data — the layout
wraps and scrolls for both); Safari, Firefox and a real touch device.

## Suggested commits

1. `feat(server): the plan list says how each published week went`
2. `feat(dashboard): plans tab — week rail, week calendar, empty-week starts, consistency`
3. `docs: plans tab v3 report`

```bash
git add -A -- packages/types/src/index.ts apps/server/src/features/plans/planBuilder.service.ts apps/server/src/features/plans/__tests__/planBuilder.test.ts
git commit -m "feat(server): the plan list says how each published week went"

git add -A -- apps/dashboard/src/features/trainees/components/TraineePlans/TraineePlans.tsx apps/dashboard/src/features/trainees/components/WeekRail apps/dashboard/src/features/trainees/components/WeekRailItem apps/dashboard/src/features/trainees/components/WeekHero apps/dashboard/src/features/trainees/components/WeekInfo apps/dashboard/src/features/trainees/components/WeekCalendar apps/dashboard/src/features/trainees/components/CalendarDay apps/dashboard/src/features/trainees/components/CalendarWorkout apps/dashboard/src/features/trainees/components/EmptyWeekStarts apps/dashboard/src/features/trainees/components/ConsistencyCard apps/dashboard/src/features/trainees/components/ThisWeekCard apps/dashboard/src/features/trainees/components/NextWeekCard apps/dashboard/src/features/trainees/components/WeekTimeline apps/dashboard/src/features/trainees/hooks/useTraineeWeeks.ts apps/dashboard/src/features/trainees/hooks/useSelectedWeek.ts apps/dashboard/src/features/trainees/hooks/useNewPlanPopover.ts apps/dashboard/src/features/trainees/data/planWeeks.ts apps/dashboard/src/features/trainees/copy/he.ts apps/dashboard/src/features/trainees/copy/en.ts
git commit -m "feat(dashboard): plans tab — week rail, week calendar, empty-week starts, consistency"

git add -A -- docs/phase-reports/design-plans-tab-v3.md
git commit -m "docs: plans tab v3 report"
```
