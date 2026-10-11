# Design update — Onboarding questionnaire (mobile, trainee)

Reference: `docs/design/onboarding-deck.html` (look, layout, motion only).
Visual and interaction changes only: no server change, no API or payload change.

## Summary

- Every onboarding step except activities is now one white card on a stacked deck (two tilted
  ghost cards), on the pink gradient with the small logo mark on top. Inside the card: one
  progress segment per real step (10), the "Q.0N" label, the question, the step's small helper
  line, the answers, and the actions row (muted Back, ink Next with the double ring).
- The activities step is the curved wheel picker over the whole screen, built from the existing
  activity list (31 activities, same ids and order, their emoji as icons). The activity at the
  center of the wheel shows its existing Cloudinary video as the background.
- Motion (GSAP): Next tosses the card sideways and the next card rises from the deck; Back
  mirrors it; the side follows the reading direction. The wheel spins in on entry.
  Reduced motion: instant swaps, no spin, no inertia.
- The reference's questions, options and texts were NOT copied. Where the reference and our
  data differ, our data won (see "Where the design was adapted to our data").

## The "nothing changed" checklist

- [x] Steps: the same 10, same ids, same order (`welcome`, `basic_profile`, `goals`,
      `frequency`, `activities`, `exercise_preferences`, `recovery`, `equipment`,
      `nutrition_preferences`, `review`). `STEP_IDS`, `STEP_COUNT` and the step indexes are untouched.
- [x] Questions and every existing text: read from the same copy keys as before
      (`features/onboarding/copy`, shared `onboardingOptions.*` / `nutrition.*`). No existing
      key was changed, renamed or removed.
- [x] Options: same lists, same ids, same count, same order — goals 7, equipment 9, muscle
      groups 8, recovery flags 5, experience 3, days 1–7 (min and max), activities 31 in 7
      categories, the whole nutrition step. `data/options.ts` and `data/activities.ts` are untouched.
- [x] Single / multi select: unchanged. Goals, equipment, muscles, recovery flags, activities =
      multi. Experience = one choice, tap again clears. Min / max days keep their rule
      (min never above max). Units, "flexible schedule", the nutrition chips: unchanged handlers.
- [x] Input types: unchanged (name text, birth date `type="date"`, height / weight number,
      gender select, the two autocompletes, recovery notes, every nutrition field). The shared
      `Input`, `Select` and `Autocomplete` components are used as before — only restyled inside the card.
- [x] Validation: `isStepValid`, `isNutritionStepValid`, `clampToFirstInvalidStep` untouched.
      Next is disabled by exactly the same rule (now at 30 % opacity).
- [x] Skip: "Skip for now" on exercise preferences and the nutrition Skip call the same handlers.
- [x] Saving / resume: `getMyOnboarding`, `saveOnboardingStep`, `skipOnboardingStep`,
      `completeOnboarding` and `services/onboarding/onboardingService.ts` are untouched; a step is
      saved before moving on; resume opens the step after the last saved one; each step is still
      its own history entry (system back = previous step).
- [x] Payload shape: unchanged. Checked in the browser: the PATCH after the activities step was
      `{ step: 'activities', answers: { preferredActivities: [...] } }`.
- [x] Edit one step from Profile (`/onboarding/:step`): same Cancel / Save changes and logic,
      now on the card (no progress, no Q label — as before it has no place in the flow).
- [x] Videos: same source and mapping (`ACTIVITY_VIDEO_MAP` from `onboardingMedia.json`), same
      rules (poster first, hidden until it really plays, data saver / 2G = poster only, 8 s slow
      network cut-off). `other_activity` still has no clip.
- [x] Server, `@sistem/types`, `@sistem/api-client`, `@sistem/shared`: not touched.

Two small things in `OnboardingPage.tsx` that are not pure styling — both only decide what is drawn:

1. The page draws `shownIndex` (from `useDeckTransition`) instead of `stepIndex`, so the old
   card can leave before the new one appears. The stage is `inert` during those 0.3 s. All
   handlers still use the real `stepIndex`.
2. The loading spinner stays one moment longer — until the "step to resume at" has been written
   to the history entry. Before, the welcome step could flash for a frame on resume; with the
   toss animation it would have been thrown away in front of her. The load itself is unchanged.

## Where the design was adapted to our data

1. **10 steps, not 4** — 10 progress segments (they shrink to fit); the label runs Q.01 … Q.10
   (computed from the step index and total, padded to the total's width).
2. **Rule label** — the existing `chooseAll` ("בחרי את כל מה שמתאים.") is the multi-select rule on
   goals, equipment and activities, as today. Steps that had another helper line keep it in the
   same place (exercise preferences, recovery, nutrition). No "בחירה אחת" key was added: no step
   is a single-choice question as a whole; the single-choice groups have their own existing labels.
3. **Activities** — 31 items with categories and no "none" option. The wheel holds all 31 in
   list order; the centered activity's existing category label shows under the hints. There is
   no "none" behavior to keep, so none was added. Next still needs at least one activity.
4. **Long activity names** ("חדר כושר / אימוני כוח") — the mark / remove button is a full-width
   row above Back / Next (it does not fit between them). The marked activities are one line of
   chips that scrolls sideways (she may mark many).
5. **Icons** — the activities' existing emoji sit in the wheel's icon pill. The option lists
   (goals, equipment) no longer show their emoji, to match the clean list of the reference;
   the emoji stay in the data files. Say if you want them back in the rows.
6. **Fields** — height has its unit in its label and weight follows the unit chips, so the rows
   are label + value (no separate unit column). Free-text fields (autocompletes, recovery notes,
   nutrition) are underline fields with the label above: their labels are too long for one row.
7. **Number pills** — min / max days (1–7), the unit chips, "flexible schedule" and the
   nutrition chips are round pills, ink when chosen (`SelectableChip`, restyled).
8. **Long steps** — basic profile, frequency and above all nutrition are taller than the
   reference's cards. The card grows and the page scrolls; the ghost cards follow its size.
   Equipment and muscle groups use two columns.
9. **Real videos are dark** — the reference veil (55 % white on top) left the header and the
   grey labels unreadable on the real clips. The veil is stronger on top (88 % → 45 % → 30 % pink),
   and while a video shows, the off-center labels sit on a frosted pill and the muted lines turn
   to ink. Compare with the prototype and say if you want it lighter.
10. **Video follows the wheel after 180 ms** — a swipe passes many activities; a clip is fetched
    only for one the wheel rests on (otherwise every passed clip would start downloading).
11. **Fonts** — the reference's Rubik / JetBrains Mono were not added (fonts are still the
    owner's open choice, per-language tokens). "Q.0N" uses a system monospace token.
12. **English** — the wheel mirrors to the right side.

## What changed

**Background** — `OnboardingBackground`: clips → gradient (`--gradient-onboarding`, the ported
`.bg-grad`) → veil. While a clip shows, the gradient fades out and the veil in (0.6 s). Only the
centered clip and its two neighbours are mounted; neighbours are preloaded and paused; a clip
that leaves is paused and emptied. Leaving the step hides the video.

**Deck and card** — `CardDeck` (ghosts −6° / +4°), `QuestionCard` (radius 22, soft pink
shadow), `StepHeading` (segments, Q label, question 22 px / 600, helper lines), `OptionList`
(round radios / rounded-square checkboxes, Neon Pink fill + white check with a pop),
`DeckActions` + `DeckButton` (ink Next, radius 14, double ring; muted Back / Skip / Cancel).

**Wheel** — `ActivityWheel` + `useWheelPicker` + `data/wheelGeometry.ts`. Drag / swipe with
inertia and snapping, mouse wheel, Arrow Up / Down, tap another item = bring to center, tap the
centered item or Space / Enter = mark. `role="listbox"`, `aria-multiselectable`, options with
`aria-selected`, `aria-activedescendant`, focus ring on the handle.

**Motion** — `useDeckTransition`: toss (x 260, 9°, fade) → rise (y 26 → 0, scale 0.95 → 1, a
small turn → 0); the wheel screen fades its header / footer up; first card and ghosts fan in.
`gsap.context().revert()` / `tween.kill()` on unmount.

## Correction: pink buttons

The reference was updated: the onboarding buttons are pink, not black. Styles only — no logic,
data, copy or markup change (the lines above that say "ink Next with the double ring" and
"ink when chosen" describe the first version).

- **Next / finish / Save changes / Try again** (`DeckButton` `primary`, every step and the
  wheel): Neon Pink pill, 50 px high, fully round, white text 600, no border, the double ring
  removed, shadow `0 8px 20px` Neon Pink 28 %. Press = `scale(0.97)`; the transition is transform
  only, 140 ms `cubic-bezier(0.23, 1, 0.32, 1)`. Disabled = opacity 0.35, no shadow (while saving
  it keeps full color and shadow). Focus ring in Cherry Rose. Its spinner is white on the pink.
- **Chosen pills** (`SelectableChip`): Neon Pink fill + white text. This is every chip in
  onboarding, not only the day numbers — units, "flexible schedule" and the nutrition chips used
  the same ink fill, so they changed with it. Their press / hover border is pink too.
- **Wheel toggle** (`DeckButton` `toggle`): soft-pink pill, Cherry Rose text, no border, same
  press. When the centered activity is already marked: white 85 % background, muted text.
- **Back / Skip / Cancel**: unchanged (muted text).
- "pink-soft" = the existing `--color-primary-tint` (`#FFE6F0`, the reference's value) — not
  `--color-primary-soft`, which is a different, lighter mix.
- The 5 px space `DeckActions` kept beside Next was only there for the ring; removed with it.
- Still ink on purpose: the wheel's small center handle (it is ink in the updated reference
  too, and is not a button). Nothing else in onboarding uses the black style.
- Note: white text on Neon Pink is about 3.7 : 1 (PRD §12) — fine for the 16 px / 600 button
  label and the 18 px day numbers; the smaller chip labels (16 px / 500) are at the edge.

Tokens (`packages/tokens/tokens.css`): added `--shadow-button`, `--transition-press`,
`--ease-press`; `--opacity-disabled-strong` 0.3 → 0.35; removed `--ring-button` and
`--surface-button-on-video` (unused now).

Files changed
- `packages/tokens/tokens.css`
- `apps/mobile/src/features/onboarding/components/DeckButton/DeckButton.css`
  (+ the variant comment in `DeckButton.tsx`)
- `apps/mobile/src/features/onboarding/components/SelectableChip/SelectableChip.css`
- `apps/mobile/src/features/onboarding/components/DeckActions/DeckActions.css`
- `docs/phase-reports/design-onboarding.md`

Checked: `npm run build -w @sistem/mobile` and `npm run lint` pass. Not looked at in a browser
this time — please check the pink pill, its disabled state and the toggle's two states on screen.

If the first version is not committed yet, these changes are already inside the commands at the
end of this report. If it is, use:

```
git add -A -- packages/tokens/tokens.css apps/mobile/src/features/onboarding/components/DeckButton apps/mobile/src/features/onboarding/components/SelectableChip/SelectableChip.css apps/mobile/src/features/onboarding/components/DeckActions/DeckActions.css
git commit -m "fix(mobile): pink onboarding buttons and pills instead of black"

git add -A -- docs/phase-reports/design-onboarding.md docs/design/onboarding-deck.html
git commit -m "docs: onboarding pink buttons correction"
```

## New i18n keys (he + en) — `features/onboarding/copy`

| Key | he | en (placeholder) |
|---|---|---|
| `activities.wheelHint` | גללי, ולחצי על פעילות כדי לסמן אותה | Scroll, and tap an activity to mark it |
| `activities.mark` | סמני {activity} | Mark {activity} |
| `activities.unmark` | הסירי {activity} | Remove {activity} |
| `activities.noneMarked` | עוד לא סימנת פעילות | No activity marked yet |

The Hebrew is the wording from the design brief. `flow.step` ("שלב 3 מתוך 10") is no longer
visible text; it is the progress bar's screen-reader label.

## New tokens — `packages/tokens/tokens.css`

- Colors: `--color-pink-mist`, `--color-pink-light`, `--color-pink-mid`, `--color-pink-bright`,
  `--color-pink-glow`, `--color-card`, `--color-ghost`, `--color-ghost-light`,
  `--color-ghost-border`, `--color-control-border`, `--color-placeholder`, `--color-wheel-icon`,
  `--color-wheel-label`, `--color-wheel-line`, `--color-wheel-pill`, `--surface-chip-on-video`
- Gradients: `--gradient-onboarding`, `--gradient-video-veil`, `--gradient-progress`
- Type: `--font-family-mono`, `--line-height-snug`
- Shape: `--radius-card` (22), `--radius-button` (14), `--radius-check` (6), `--radius-chip` (16)
- Shadows / rings: `--shadow-card`, `--shadow-ghost`, `--shadow-button`, `--ring-center`,
  `--ring-badge`, `--ring-focus`, `--text-glow-on-video`, `--blur-soft`
- Motion / opacity: `--transition-fade` (600 ms), `--ease-pop`, `--transition-press`, `--ease-press`,
  `--opacity-disabled-strong` (0.35)

## Files

Added (all under `apps/mobile/src/features/onboarding/`)
- `components/OnboardingBackground/OnboardingBackground.tsx` + `.css`
- `components/CardDeck/CardDeck.tsx` + `.css`
- `components/QuestionCard/QuestionCard.tsx` + `.css`
- `components/StepHeading/StepHeading.tsx` + `.css`
- `components/OptionList/OptionList.tsx` + `.css`
- `components/DeckActions/DeckActions.tsx` + `.css`
- `components/DeckButton/DeckButton.tsx` + `.css`
- `components/ActivityWheel/ActivityWheel.tsx` + `.css`
- `hooks/useWheelPicker.ts`, `hooks/useDeckTransition.ts`, `hooks/useBackgroundClip.ts`
- `data/wheelGeometry.ts`
- `docs/phase-reports/design-onboarding.md`

Changed
- `packages/tokens/tokens.css`
- `pages/OnboardingPage/OnboardingPage.tsx` + `.css`
- `components/OnboardingProgress/OnboardingProgress.tsx` + `.css` (segments)
- `components/SelectableChip/SelectableChip.css` (round pill, ink when chosen)
- `components/AccordionSection/AccordionSection.css` (rounded, on the card)
- `steps/ActivitiesStep/ActivitiesStep.tsx` + `.css` (the wheel screen)
- `steps/BasicProfileStep/BasicProfileStep.tsx` + `.css`
- `steps/FrequencyStep/FrequencyStep.tsx` + `.css`
- `steps/ExercisePreferencesStep/ExercisePreferencesStep.tsx` + `.css`
- `steps/NutritionPreferencesStep/NutritionPreferencesStep.tsx` + `.css`
- `steps/GoalsStep/GoalsStep.tsx`, `steps/EquipmentStep/EquipmentStep.tsx`,
  `steps/RecoveryStep/RecoveryStep.tsx`, `steps/ReviewStep/ReviewStep.tsx`,
  `steps/WelcomeStep/WelcomeStep.tsx` (the title / helper line moved to `StepHeading`)
- `copy/he.ts`, `copy/en.ts` (4 keys), `data/stepVideoMap.ts` (comment only)

Deleted (unused now)
- `components/StepVideoBackground/StepVideoBackground.tsx` + `.css` — replaced by
  `OnboardingBackground` + `useBackgroundClip` (same loading rules)
- `steps/GoalsStep/GoalsStep.css`, `steps/EquipmentStep/EquipmentStep.css`,
  `steps/RecoveryStep/RecoveryStep.css`, `steps/WelcomeStep/WelcomeStep.css` (was empty)
- Old page classes: `.onboarding-header / -body / -footer / -step / -error`

Not deleted: `hooks/usePageEnter.ts` (still used by AppShell / PageLayout),
`hooks/useKeyboardInset.ts` (still used here: room under the card for the iOS keyboard).

## Dependencies

None added or removed (`gsap`, `@tabler/icons-react` were already in `apps/mobile`).

## How to test

```
npm run build -w @sistem/mobile     # passes
npm run lint                        # passes (i18n audit clean; the old AuthContext warning only)
npm run test:i18n                   # passes (22 tests)
npm run dev
```

Sign up a new trainee at http://localhost:5173 (iPhone SE and Pro Max sizes in DevTools).

1. **Every step** — go 1 → 10. On each: segments match the step, "Q.0N" counts up to Q.10, the
   question and texts are the ones you know, Next is disabled until the step is valid (basic
   profile, goals, activities, equipment). Step 6 has "דילוג בינתיים", step 9 "דילוג".
2. **Transitions** — Next: the card flies left with a turn, the next one rises from the deck.
   Back: mirrored. Also use the browser / system back gesture.
3. **Wheel by touch** — drag slowly (it follows the finger and snaps), flick (it coasts and
   snaps), tap an item away from the center (it comes to the center), tap the centered item
   (pink check badge, a chip appears, the button turns to "הסירי …"). Tap again to remove.
4. **Wheel by mouse** — mouse wheel over it turns it and settles on an item; click works like tap.
5. **Wheel by keyboard** — Tab to the wheel (the handle gets a pink ring), Arrow Down / Up,
   Space or Enter marks the centered activity.
6. **Videos** — stop on an activity: its video fades in behind a light veil. Move on: the next
   one replaces it. Stop on "פעילות אחרת" (last item): back to the gradient. Network tab: only
   the centered clip and its two neighbours load. Next / Back: the video disappears.
7. **Reduced motion** — DevTools → Rendering → "Emulate CSS prefers-reduced-motion": steps swap
   at once, the wheel does not spin in and has no inertia, but drag / tap / keys still work.
8. **Resume** — answer up to step 4, reload: it opens on step 5 directly (no welcome flash),
   with the answers in place. Back from there goes to step 4.
9. **Edit from Profile** — as a trainee with a plan (`trainee2@sistem.dev`): Profile → edit a
   step. The card has ביטול / שמירת השינויים and no progress; the activities step is the wheel.
10. **English** — switch the language on the login screen first: texts in English, the wheel on
    the right, Next tosses the card to the right.
11. **Finish** — step 10 "יצירת הפרופיל שלי" → the waiting screen, as before.

What was checked here (Chrome, the real `OnboardingPage` in a 390 × 844 frame with a faked API,
so no account was created and your coach session was not touched): all 10 steps in Hebrew, the
save payloads, Back, resume on step 3 and step 5 without a flash, edit mode (goals), the wheel
by drag, tap, mouse wheel and keys, marking / removing, the chips, the three mounted clips
around the center, the video hidden after leaving, and the English mirror.
**Not checked:** the animations in real time (the automation tab runs in the background, where
frames are throttled — I saw start, middle and end states only), a video actually playing (the
background tab does not load media; only the posters showed), reduced motion in the browser
(the code paths were read, not run), iPhone SE size, a real phone / touch screen, the iOS
keyboard, and the final "complete" call.

## Known issues / TODOs

1. **Please look at it moving on a phone** — toss / rise timing, wheel inertia and the video
   cross-fade were tuned from the reference's numbers, not by eye.
2. **Readability over video** (item 9 above) is my change to the reference — check it.
3. **Emoji removed from the goal / equipment rows** (item 5) — say if you want them back.
4. An English (left-to-right) name in the name field sits next to its label instead of at the
   far end of the row (the field is `dir="auto"`). Hebrew names are fine.
5. The frequency and recovery cards are about as tall as an 844 px screen; on an iPhone SE they
   scroll. Nutrition always scrolls when a section is open.
6. `CLAUDE.md` still describes the old onboarding screen parts (it is gitignored; I did not edit it).
7. **Other work in the tree** — `packages/api-client/src/createApiClient.ts`,
   `vitest.i18n.config.mts`, `scripts/api-client.test.ts` were already changed before this task
   and are not in the commands below. `docs/design/` is the reference you added; commit it if you want it kept.

## Suggested commits

1. `feat(tokens): onboarding deck tokens (gradient, card, wheel, rings)`
2. `feat(mobile): redesign onboarding as a card deck with a curved activity wheel`
3. `docs: onboarding design update report`

```
git add -A -- packages/tokens/tokens.css
git commit -m "feat(tokens): onboarding deck tokens (gradient, card, wheel, rings)"

git add -A -- apps/mobile/src/features/onboarding
git commit -m "feat(mobile): redesign onboarding as a card deck with a curved activity wheel"

git add -A -- docs/phase-reports/design-onboarding.md docs/design/onboarding-deck.html
git commit -m "docs: onboarding design update report"
```
