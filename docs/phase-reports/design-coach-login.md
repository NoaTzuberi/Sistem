# Design update — Coach Dashboard Login (apps/dashboard, web)

Two passes: the first built the screen, the second (this revision) replaced the background and
the language toggle.

**The reference file is still not available.** `docs/design/coach-login.html` does not exist —
there is no `docs/design/` folder in the repo, and no file by that name anywhere on this Mac
(Downloads and Desktop were searched too). Both passes were built from the written briefs.
Because of that:

1. **`flow()` is not the prototype's.** The brief says to port it exactly; without the file it
   was written from the description (each line waves gently; a soft swell — a bulge whose center
   drifts slowly left and right — travels across them). It lives alone at the top of
   `flowScene.ts` with its numbers — replacing that one function is the whole fix.
2. **The three feature captions are placeholders** — the briefs give the titles (מתאמנות /
   תוכניות / תזונה) but not the muted caption under each.

Everything else the briefs state is done as written. Other values they do not give are listed
under "Chosen without the reference".

## What was corrected in this pass

**1. Background** — `FlowingLanesBackground` (diagonal lanes + runner dots) is deleted with its
scene file and its six `--lanes-*` tokens. New `FlowBackground`:
- a fixed full-viewport canvas: Bright Snow, the two soft pink corner glows (0.10 / 0.07);
- horizontal lines across the full width, one every 30px from top to bottom; each waves gently
  and a soft swell drifts across them; every 5th line is stronger;
- devicePixelRatio capped at 2, one rAF loop, stopped while `document.hidden`, recomputed on
  resize (`ResizeObserver`), cleaned up on unmount; reduced motion = one still frame.

**2. Language toggle** — new `LanguageToggle` component, pinned to the top-left corner of the
login (24px; 14px under 900px), replacing the square switch that sat under the card:
- glass pill (white 70 % + blur, 1px Platinum border, soft pink shadow);
- "EN" then "עב", in that order in both languages (the group is always left-to-right);
- the active option sits on a Neon Pink pill that slides between the two (0.3 s,
  `cubic-bezier(.2,.8,.2,1)`), white text; the other is muted. No slide under reduced motion;
- `role="group"` + label, `aria-pressed` and `lang` on each button, the full language name as
  each button's accessible name, a visible focus ring;
- the same logic as the Phase 15 switch (`useI18n().setLanguage`): text and direction switch at
  once, no reload. In English the brand block is on the left and the card on the right.

"Shared": there is no shared UI package in the repo (`@sistem/shared` is logic only, by its own
rule), and adding one is an architecture change I did not make without asking. The component
depends only on `@sistem/shared` and the tokens and takes its position from the screen, so the
mobile app can take the folder as it is. Say if you want a `packages/ui` for it.

The dashboard's top bar still uses the old `LanguageSwitch` (it also saves the language on the
server) — the brief was about the login. It can move to `LanguageToggle` in one line.

## Summary of the whole screen

- Two columns up to 1200px, vertically centered: brand block (logo on a Neon Pink tile, COACH
  badge, "ה-Sisterhood שלך.", sub line, three feature labels) and the frosted login card with
  pill fields and the pink "כניסה לדשבורד" button. Hebrew: brand right, card left.
- GSAP entrance: lines fade in over 1.4 s, the brand block's children rise in staggered, the
  card rises. Killed on unmount. Reduced motion: everything in place at once.
- Under 900px: one column, centered, card full width up to 440px.
- Visual only: the login call, the coach-role check, the error messages, the redirect, the
  server and the API are unchanged.

**Hidden controls (`features/auth/data/authConfig.ts`)**
- `REMEMBER_ME_ENABLED = false` — the auth has no remember-me (the token always stays in
  localStorage), so the checkbox is built and hidden behind a TODO.
- `FORGOT_PASSWORD_ENABLED = false` — **the dashboard has no forgot-password screen**, so the
  "שכחתי" pill is built and hidden too (a pill that does nothing seemed worse than none). Say if
  you want it visible.

**Link to the app** — `VITE_TRAINEE_APP_URL` (`app/config/env.ts`). Missing, empty or not an
http(s) address: the whole line "מתאמנת? הכניסה שלך באפליקציה" is hidden. Documented in
`apps/dashboard/.env.example` (example value only).

**Tokens (`packages/tokens/tokens.css`)**
- Added: `--flow-glow-top-alpha` (0.1), `--flow-glow-bottom-alpha` (0.07), `--flow-line-alpha`,
  `--flow-line-strong-alpha`, `--surface-frosted` (white 82 %), `--surface-frosted-light`
  (white 70 %), `--color-surface-soft`, `--transition-slide` (300ms), `--ease-slide`.
- Reused: `--color-primary-tint` (#FFE6F0) and `--radius-block` (20px) from the waiting-screen
  update, `--glass-blur`, `--shadow-glass`, `--shadow-primary`, `--breakpoint-xl` (900px).

**Copy**
- `apps/dashboard/src/copy` (he + en): the `login.*` group; `loginTitle` and `logIn` removed.
- `packages/shared/src/copy` (he + en): `languageShort` = `{ he: 'עב', en: 'EN' }`.

## Chosen without the reference (please check against the prototype)

1. The `flow()` curve (see the top), the two line alphas and line widths.
2. Entrance timings other than the 1.4 s fade: rise distances (24 / 32 px), stagger (90 ms).
3. Sizes: headline `clamp(36px, 4.6vw, 64px)`, column gap 96px, card padding 32px, controls
   52px tall, icon chips 36px, toggle options 44 × 36px.
4. English wording (other than "Your Sisterhood.") is my placeholder.
5. Under 900px the page has extra top padding so the fixed toggle does not sit on the logo tile
   when the page is at the top.

## Files

Added
- apps/dashboard/src/components/common/FlowBackground/FlowBackground.tsx + .css
- apps/dashboard/src/components/common/FlowBackground/flowScene.ts
- apps/dashboard/src/components/common/LanguageToggle/LanguageToggle.tsx + .css
- apps/dashboard/src/features/auth/hooks/useLoginEntrance.ts
- apps/dashboard/src/features/auth/data/authConfig.ts
- apps/dashboard/src/features/auth/components/LoginField/LoginField.tsx + .css
- apps/dashboard/src/features/auth/components/LoginIcons/LoginIcons.tsx
- apps/dashboard/src/app/config/env.ts
- docs/phase-reports/design-coach-login.md

Modified
- packages/tokens/tokens.css
- packages/shared/src/copy/he.ts, en.ts
- apps/dashboard/package.json, package-lock.json
- apps/dashboard/.env.example
- apps/dashboard/src/components/common/Logo/Logo.tsx
- apps/dashboard/src/copy/he.ts, en.ts
- apps/dashboard/src/features/auth/pages/Login/Login.tsx
- apps/dashboard/src/features/auth/pages/Login/Login.css

Removed in this pass (never committed — they existed only in the working tree)
- apps/dashboard/src/components/common/FlowingLanesBackground/ (component, CSS, `lanesScene.ts`)
- the `--lanes-*` tokens

## Dependencies

Added: `gsap` ^3.15.0 to `apps/dashboard` (the version the mobile app already uses).

## How to test

```
npm install                          # gsap is new in the dashboard workspace
npm run build                        # passes (dashboard + mobile checked)
npm run lint                         # passes (i18n audit clean; the old AuthContext warnings only)
npm run test:i18n                    # passes (20 tests)
npm run dev:all
```

Open http://localhost:5174/login (log out first if you are logged in).

1. **Desktop** (≥ 900px): brand block on the right, card on the left, centered; the toggle in
   the top-left corner. Reload: the lines fade in, the brand lines rise one after the other,
   the card rises. The lines wave gently and a bulge drifts slowly left and right.
2. **he ↔ en** — click "EN": the pink pill slides to EN, every text turns English ("Your
   Sisterhood." with "Sis" pink), the brand block moves to the left and the card to the right,
   the button's arrow points right — with no reload. The toggle itself stays in the top-left
   corner, still "EN | עב". Click "עב": everything returns. Reload: the choice is remembered.
3. **Keyboard** — Tab reaches both toggle buttons with a visible ring; Enter / Space switches.
4. **Login** — wrong password: the same error as before, above the button. A trainee account:
   "הדשבורד הזה מיועד לחשבונות מאמנת בלבד." A coach (seed: coach@sistem.dev): the dashboard opens.
5. **390px** (DevTools device toolbar): one column, everything centered, card full width, the
   toggle 14px from the corner, no horizontal scroll. Check 899 / 900px for the layout switch.
6. **Reduced motion** — DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce",
   reload: still lines, everything in place at once; the toggle's pill jumps instead of sliding.
7. **Hidden tab** — switch to another tab and back: the lines continue from where they stopped.
8. **Missing env var** — with no `VITE_TRAINEE_APP_URL` in `apps/dashboard/.env`, the card ends
   at the button (no "מתאמנת?" line). Add `VITE_TRAINEE_APP_URL=http://localhost:5173`, let Vite
   restart: the line appears and its link opens the app. Try a bad value (`abc`): hidden again.
9. **Hidden controls** — set `REMEMBER_ME_ENABLED` / `FORGOT_PASSWORD_ENABLED` to `true` in
   `features/auth/data/authConfig.ts` to see the checkbox and the "שכחתי" pill (they do nothing
   yet). Set them back.

What was checked here: both builds, lint, the parity test. Headless Chrome at 1440 × 900 with
reduced motion forced (Hebrew): two columns, the toggle in the corner with the pill on "עב",
lines over the full width and height with every 5th stronger, a still frame. A live Chrome tab
at 1512px: clicking "EN" switched `lang` / `dir` with no reload, all texts English, brand block
on the left (x 156) and card on the right (x 916), the toggle unmoved at 24 / 24 with the same
button order, `aria-pressed` swapped, the group label translated; clicking "עב" returned it.
The first pass also checked 310px wide: one column, no horizontal scroll.
**Not checked:** the entrance, the swell and the pill's slide watched in motion (the automation
tab runs in the background, where the browser stops animation frames); 390px after this pass
(the toggle and the new top padding); a real login round-trip on the new markup; the env var
set; the two hidden controls turned on; Safari / Firefox (backdrop blur).

## Known issues / TODOs

1. **Reference missing** — put the prototype at `docs/design/coach-login.html` (the file itself,
   inside the repo folder) and I will port `flow()` exactly and line up the values and captions.
2. **Captions** — `login.features.*.caption` are placeholders (he + en).
3. **Forgot password** on the dashboard does not exist; the pill waits behind its flag.
4. **Shared toggle** — see "Language toggle" above: no shared UI package yet.
5. **Shared file** — `packages/tokens/tokens.css` also holds the waiting-screen update's tokens
   (not committed yet). The first commit below takes the whole file.
6. **Other work in the tree** — uncommitted changes from the waiting-screen and the
   coach-dashboard-link updates are untouched; the commands below add only this task's files.

## Suggested commits

1. `feat(tokens): flow background, frosted surfaces and slide motion tokens`
2. `chore(dashboard): add gsap`
3. `feat(dashboard): flow lines background`
4. `feat(dashboard): sliding glass language toggle`
5. `feat(dashboard): redesign the coach login`
6. `docs: coach login design update report`

```
git add -A -- packages/tokens/tokens.css
git commit -m "feat(tokens): flow background, frosted surfaces and slide motion tokens"

git add -A -- apps/dashboard/package.json package-lock.json
git commit -m "chore(dashboard): add gsap"

git add -A -- apps/dashboard/src/components/common/FlowBackground
git commit -m "feat(dashboard): flow lines background"

git add -A -- apps/dashboard/src/components/common/LanguageToggle packages/shared/src/copy/he.ts packages/shared/src/copy/en.ts
git commit -m "feat(dashboard): sliding glass language toggle"

git add -A -- apps/dashboard/src/features/auth apps/dashboard/src/app/config/env.ts apps/dashboard/src/components/common/Logo/Logo.tsx apps/dashboard/src/copy apps/dashboard/.env.example
git commit -m "feat(dashboard): redesign the coach login"

git add -A -- docs/phase-reports/design-coach-login.md
git commit -m "docs: coach login design update report"
```
