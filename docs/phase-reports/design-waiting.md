# Design update — 48h Waiting screen (mobile, trainee)

**The reference file was not available.** `docs/design/waiting-screen.html` is not in the repo
(there is no `docs/design/` folder) and is not in Downloads or `Desktop/SISTEM` either. This was
built from the written brief only. Everything the brief states is done as written; the values
the brief does not give are my choices and are listed under "Chosen without the reference" —
please compare them with the prototype.

## Summary

- The waiting screen has the new look: white background, small logo mark on top, the four 3D
  items running off their screen edges with a soft neutral shadow, the title, the countdown in
  a soft-pink rounded block with a label under each unit, one muted line under it, and at the
  bottom the pink pill "הפעילי התראות" (hidden for now) with "התנתקות" as a small text button.
- Motion (GSAP, already a dependency): items fly in from their own side, the center block
  rises, then the footer, then the items float forever. Reduced motion shows the final state at
  once. Everything is killed on unmount. The items never react to pointer, touch or tilt.
- "Plan ready" moment: when the poll sees the plan was published, the title changes to
  "התוכנית שלך מוכנה!", the countdown block pops, the items hop, and after 1.2 s the app goes
  on to Home exactly as before.
- Push CTA is behind `PUSH_ENABLED = false` with a `usePushPermission()` stub (`TODO(5b)`).
- Visual only: the countdown math (server time), the poll, the detection, routing and the
  server are untouched. The existing 512 px 3D assets and the existing logo mark are used.

## What changed

**Layout (`features/waiting/pages/WaitingPage`)**
- Items are placed by id (`.waiting-item-dumbbell | -ez-bar | -step | -bench`): dumbbell left /
  upper, EZ bar right / upper, step left / lower, bench right / lower. They keep their side in
  English too (they are pictures; the CSS says so in `physical:` comments).
- The item layer and every item have `pointer-events: none`.
- The lower items rest above the footer. The footer's height is one CSS variable that grows when
  the CTA is shown (`.waiting-page-with-cta`), so they never sit under the button.
- Log out is the existing `LogoutButton` with a new optional `variant` prop (`ghost` here; the
  default is unchanged, so Profile / Settings / coach Profile look the same).

**Countdown (`features/waiting/components/Countdown`)** — three units (hours, minutes,
seconds) with a label under each, Cherry Rose tabular digits, soft-pink block, radius 20 px.
The row is `dir="ltr"`, so the clock reads hours → seconds left to right in Hebrew too. It
still gets `remainingMs` from the page; the calculation did not change.

**Motion (`features/waiting/hooks/useWaitingMotion.ts`, replaces `useFloatingIcons.ts`)**
- One timeline in a `gsap.context`: fly-in (`back.out(1.4)`, 80 ms stagger, a little rotation)
  → center block (y 24 → 0, fade) → footer → float (y ±9 px, rotation ±2°, `sine.inOut` yoyo,
  2.8 / 3.3 / 3.7 / 4.2 s). Start positions are set in a layout effect (no flash).
- Ready moment: title fades in, countdown scales 0.94 → 1, each item's image hops (the hop is
  on the image inside the item, so it does not fight the float).
- `context.revert()` on unmount.

**Ready moment (`WaitingPage.tsx`)** — the poll is the same. Where it used to call
`updateUser({ appState })` at once, it now sets `isReady` and calls it 1200 ms later (only when
the new state is `home`; any other state still updates at once). A second poll during the
moment does not schedule it twice; the timer is cleared on unmount.

**Push (`features/notifications`)** — `data/pushConfig.ts` (`PUSH_ENABLED = false`) and
`hooks/usePushPermission.ts` (stub: `status: 'prompt'`, `request()` does nothing). The CTA
shows when the flag is on and the status is `prompt`.

**Tokens added (`packages/tokens/tokens.css`)**
- `--color-primary-tint: #ffe6f0` (the existing `--color-primary-soft` is a different pink).
- `--radius-block: 20px`.
- `--shadow-object` (neutral, used with `filter: drop-shadow()` under the 3D items).

**Copy (`features/waiting/copy`, he + en)**
- New: `readyTitle`, `messageNote`, `hours`, `minutes`, `seconds`, `enableNotifications`.
- Changed: `message` — now "המאמנת שלך בונה לך תוכנית אישית." (the old "ready within 48
  hours" sentence is gone, as in the brief).
- "התנתקות" is the existing shared `common.logout`.

## Chosen without the reference (please check against the prototype)

1. Item sizes, offsets and resting angles (`WaitingPage.css`), and how far each runs off the edge.
2. Fly-in distance (130 % of the item's width), start rotation (±20°), duration (0.8 s), the
   overlaps between the timeline steps, and the footer's rise (y 16).
3. The items' "small bounce" at the ready moment (a 14 px hop with `bounce.out`), the pop's ease
   and the title's small fade.
4. Type sizes: title 28 px, digits 34 px, unit labels 12 px, message 14 px; CTA 52 px tall.
5. The two sentences under the countdown sit on two lines (they do not fit one line at 375 px).
6. During the ready moment the line under the countdown is hidden (space kept): "your coach is
   building…" under "your plan is ready!" read wrong. Say if the prototype keeps it.
7. English wording for the new keys is my placeholder (the brief gave Hebrew only).

## Files changed

Added
- apps/mobile/src/features/waiting/hooks/useWaitingMotion.ts
- apps/mobile/src/features/notifications/data/pushConfig.ts
- apps/mobile/src/features/notifications/hooks/usePushPermission.ts
- docs/phase-reports/design-waiting.md

Modified
- packages/tokens/tokens.css
- apps/mobile/src/components/common/LogoutButton/LogoutButton.tsx
- apps/mobile/src/features/waiting/pages/WaitingPage/WaitingPage.tsx
- apps/mobile/src/features/waiting/pages/WaitingPage/WaitingPage.css
- apps/mobile/src/features/waiting/components/Countdown/Countdown.tsx
- apps/mobile/src/features/waiting/components/Countdown/Countdown.css
- apps/mobile/src/features/waiting/data/waitingIcons.ts
- apps/mobile/src/features/waiting/copy/he.ts
- apps/mobile/src/features/waiting/copy/en.ts

Deleted
- apps/mobile/src/features/waiting/hooks/useFloatingIcons.ts

## Dependencies

None added or removed (`gsap` and `@tabler/icons-react` were already in `apps/mobile`).

## How to test

```
npm run build -w @sistem/mobile     # passes
npm run lint                        # passes (i18n audit clean; the old AuthContext warning only)
npm run test:i18n                   # passes (20 tests)
npm run dev:all
```

You need a trainee in the waiting state: sign up a new trainee in the app and finish
onboarding (the seed `trainee1@sistem.dev` already has a plan and lands on Home).

1. **Entrance** — open the app as that trainee (iPhone SE and Pro Max sizes). The four items fly
   in from their sides, the title + countdown rise, then "התנתקות"; the items then float gently.
2. **No interaction** — move the mouse / drag a finger over the items: nothing reacts. Tap
   "התנתקות" where an item is near it: it logs out (the items do not block taps).
3. **Countdown** — digits read hours : minutes : seconds from left to right, labels under each,
   no jitter every second. Reload: the time continues from the server's value.
4. **English** — Settings is not reachable here, so switch the language on the login screen
   first: text is English, the items stay on the same sides.
5. **Reduced motion** — turn on "Reduce motion" in the OS (or Chrome DevTools → Rendering →
   "Emulate CSS prefers-reduced-motion"), reload: everything is in place at once, nothing moves.
6. **Plan published while open** — keep the waiting screen open. In the dashboard
   (http://localhost:5174, the trainee's coach) build and publish a plan for this week. Within
   30 s (or at once if you switch away from the tab and back) the title changes to
   "התוכנית שלך מוכנה!", the block pops, the items hop, and about 1.2 s later Home opens.
   With reduced motion on: the title changes, nothing moves, Home opens after the same 1.2 s.
7. **Push CTA** — set `PUSH_ENABLED = true` in `features/notifications/data/pushConfig.ts`: the
   pink pill with the bell appears above "התנתקות" and the lower items move up clear of it.
   Tapping it does nothing yet. Set it back to `false`.
8. **Overdue** — unchanged: after the 48 h the countdown is replaced by the temporary
   "final touches" line.

What was checked here: build, lint, the parity test, and the real `WaitingPage` mounted in the
dev app in Chrome with a faked `/onboarding/waiting` answer, 375 px wide (Hebrew): the settled
layout with the CTA off and on (no overlap between items, text and the button), `pointer-events:
none` on the items, the ready moment (title change, one 1.2 s timer even with a second poll),
reduced motion (no inline transforms, no tweens) and unmount (24 tweens → 0).
**Not watched:** the animation in motion (the automation tab runs in the background, where the
browser stops animation frames — only start, settled and end states were seen), the real route
with a real waiting trainee, the real hand-over to Home, Pro Max height, English, and a real phone.

## Known issues / TODOs

1. **Reference missing** — see the top of this report. Put the prototype at
   `docs/design/waiting-screen.html` and I will line the values up with it.
2. **Page fade** — `AppShell` still fades the whole page in over 0.4 s on mount, so the first
   part of the fly-in happens during that fade. Say if the prototype has no such fade.
3. **CTA when push is on** — it is hidden once permission is `granted` or `denied`. 5b may want
   a different rule for `denied`.
4. `--color-primary-tint` (#FFE6F0) and `--color-primary-soft` (a 12 % mix) are now two soft
   pinks. Worth choosing one later.
5. **Other work in the tree** — there are uncommitted changes that are not part of this task
   (auth / coach dashboard link files, `apps/mobile/.env.example`, `design-coach-link.md`). The
   commands below add only this task's files.

## Suggested commits

1. `feat(tokens): soft pink tint, block radius and object shadow`
2. `feat(mobile): push permission stub behind PUSH_ENABLED`
3. `feat(mobile): redesign the 48h waiting screen with fly-in, float and ready moment`
4. `docs: waiting screen design update report`

```
git add -A -- packages/tokens/tokens.css
git commit -m "feat(tokens): soft pink tint, block radius and object shadow"

git add -A -- apps/mobile/src/features/notifications/data/pushConfig.ts apps/mobile/src/features/notifications/hooks/usePushPermission.ts
git commit -m "feat(mobile): push permission stub behind PUSH_ENABLED"

git add -A -- apps/mobile/src/features/waiting apps/mobile/src/components/common/LogoutButton/LogoutButton.tsx
git commit -m "feat(mobile): redesign the 48h waiting screen with fly-in, float and ready moment"

git add -A -- docs/phase-reports/design-waiting.md
git commit -m "docs: waiting screen design update report"
```
