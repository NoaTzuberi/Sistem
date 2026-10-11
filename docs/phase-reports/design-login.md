# Design update — Login & Sign-up screens (mobile)

Reference: the approved prototype `login-track.html` (read from the owner's Downloads folder; it is
not in the repo — see Known issues).

## Summary

- The trainee Login and Sign-up screens now use the prototype's look: the Neon Pink → Cherry Rose
  gradient with a tilted running track and three runners, the logo + tagline in white at the top,
  and a glass card with pill inputs, icon chips, the "שכחתי" pill and the pink arrow button.
- New shared `TrackBackground` canvas component, ported from the prototype (`pt()`, lane
  pre-sampling, runners, alpha values). All colors and alphas are read from `packages/tokens`.
- GSAP entrance on every mount of either screen: lanes draw on (1.4 s, inner lane first),
  runners fade in at 0.9 s, the card rises at 0.8 s. Reduced motion = one still frame, no loop.
- Visuals only: auth logic, validation, routing, error handling, the server and the API are
  untouched. Google / Apple buttons are built and hidden behind `SOCIAL_AUTH_ENABLED = false`.
- Forgot / Reset password screens are unchanged (they keep `AuthCard` + `PageLayout`).

## What changed

**Background (`components/common/TrackBackground`)**
- `trackScene.ts` — pure geometry + drawing in the prototype's 390 × 844 space, scaled to cover
  the screen (capped at 1.6× so the track does not balloon in a desktop browser).
- `TrackBackground.tsx` — devicePixelRatio capped at 2, lanes sampled once at module load, a
  single rAF loop, paused on `visibilitychange` (hidden) and on unmount, `ResizeObserver` for
  resize. A keyboard that only shortens the screen does not re-fit the track.
- The canvas is `position: fixed`; the CSS gradient shows before the first frame.

**Entrance (`features/auth/hooks/useAuthEntrance.ts`)** — one GSAP timeline (delay 0.2 s) that
drives both the canvas intro values and the card; killed on unmount.

**Screens**
- `AuthScreen` (layout: background, brand, glass card with title + switch pill, language switch
  under the card), `AuthField` (pill input), `AuthSubmitButton`, `SocialButtons`.
- `Login` / `Register` render the same fields with the same handlers through the new components.
- The layout is normal flow, not the prototype's absolute phone frame, so it scrolls on short
  screens (iPhone SE) and above the keyboard.

**Tokens added (`packages/tokens/tokens.css`)**
`--gradient-brand`, `--glass-bg`, `--glass-bg-strong`, `--glass-border`, `--glass-blur`,
`--glass-divider`, `--glass-outline`, `--track-lane-alpha`, `--track-lane-edge-alpha`,
`--track-trail-alpha`, `--track-glow-alpha`, `--color-apple-button`, `--radius-glass`,
`--shadow-glass`, `--shadow-primary`.

**Copy keys added (he + en, `features/auth/copy`)**
`tagline`, `forgotShort`, `socialDivider`, `continueWithGoogle`, `continueWithApple`.

## Differences from the prototype (on purpose)

- **Field text**: no visible labels, as in the prototype. The placeholders are the existing label
  keys (`email`, `password`), so they read "אימייל" / "סיסמה" — the prototype says "כתובת מייל".
  Existing keys were kept as asked. Sign-up shows the existing "לפחות 8 תווים" under the password.
- **Switch between screens**: the pill next to the title replaces the old "אין לך חשבון? הרשמה"
  line. `noAccount` / `haveAccount` are no longer shown on these two screens (keys kept).
- **Language switch**: not in the prototype; kept under the card, because it is the only way to
  change language before login.
- **Sizes** use the nearest token: inputs 16px (prototype 17), card padding 24px (26 / 22 / 24),
  gaps 16px (14), title weight 700 (800 — the font decision comes later). The "שכחתי" pill is
  44px tall (42) for the touch-target rule.
- **Arrow**: one right-pointing arrow with `flip-rtl`, so it points left in Hebrew like the prototype.

## Files changed

Added
- apps/mobile/src/components/common/TrackBackground/TrackBackground.tsx
- apps/mobile/src/components/common/TrackBackground/TrackBackground.css
- apps/mobile/src/components/common/TrackBackground/trackScene.ts
- apps/mobile/src/features/auth/hooks/useAuthEntrance.ts
- apps/mobile/src/features/auth/data/authConfig.ts
- apps/mobile/src/features/auth/components/AuthScreen/AuthScreen.tsx + .css
- apps/mobile/src/features/auth/components/AuthField/AuthField.tsx + .css
- apps/mobile/src/features/auth/components/AuthSubmitButton/AuthSubmitButton.tsx + .css
- apps/mobile/src/features/auth/components/SocialButtons/SocialButtons.tsx + .css
- packages/tokens/brand/sistem_logo_horizontal_transparent.png
- docs/phase-reports/design-login.md

Modified
- packages/tokens/tokens.css
- apps/mobile/src/components/common/Logo/Logo.tsx
- apps/mobile/src/features/auth/pages/Login/Login.tsx
- apps/mobile/src/features/auth/pages/Login/Login.css
- apps/mobile/src/features/auth/pages/Register/Register.tsx
- apps/mobile/src/features/auth/copy/he.ts
- apps/mobile/src/features/auth/copy/en.ts

Deleted: none.

## Dependencies

None added or removed. `gsap` and `@tabler/icons-react` were already in `apps/mobile`.

## How to test

```
npm run build -w @sistem/mobile     # passes
npm run lint                        # passes (i18n audit clean; one old warning in AuthContext)
npm run test:i18n                   # passes (he / en keys match)
npm run dev
```

Manual checks at http://localhost:5173/login (iPhone SE and Pro Max sizes):
1. Reload: lanes draw on from the inner lane, runners fade in, the card rises.
2. Tap "הרשמה" / "התחברות": the other screen opens and the entrance plays again.
3. Log in with a seed user, log out: the entrance plays again.
4. Submit empty and wrong values: the same errors as before, under each field / above the button.
5. "שכחתי" opens the Forgot Password screen (unchanged look).
6. Switch to English: layout mirrors, the arrow points right.
7. Turn on "Reduce motion" in the OS: a still track, the card is there at once, nothing moves.
8. Switch to another tab and back: the runners continue from where they stopped.
9. Set `SOCIAL_AUTH_ENABLED = true` in `features/auth/data/authConfig.ts`: the "או" divider and
   both buttons appear (they do nothing yet). Set it back.

What was checked here: build, lint and the copy parity test; both screens in Chrome in Hebrew,
in the reduced-motion (still frame) path only — the automation tab was in the background, where
the browser stops animation frames. That did confirm the loop pauses while hidden. **The
entrance animation itself, English, the social buttons and a real phone were not watched.**

## Known issues / TODOs

1. **Logo**: now the owner's transparent horizontal logo (`Logo` variant `onBrand`, file copied
   from `brand/` to `packages/tokens/brand/`). Use it only on the pink gradient. The dashboard
   `Logo` did not get this variant (it has no pink screen).
2. **Phase number**: the brief says social sign-in is Phase 5b; BUILD_PLAN has it as Phase 5c.
   The code comments say 5c.
3. **Copy to confirm**: the English tagline ("Your workout. Your pace. Your coach.") and
   "Forgot?" are my placeholders; the Google / Apple wording is a placeholder in both languages.
4. **Radius / shadow**: the tokens file says "sharp cuts, no shadows"; this design adds a 20px
   radius, pills and two shadows as new tokens for these screens only.
5. **Prototype file**: `docs/design/login-track.html` is not in the repo. Copy it there if you
   want the reference kept with the code.
6. `Register.css` is still an empty file (as before). `AuthCard` is now used only by the
   Forgot / Reset screens.
7. On a slow device the `backdrop-filter` blur over a moving canvas is the costly part; worth a
   look on a real low-end Android.

## Suggested commits

1. `feat(tokens): brand gradient, glass and track tokens`
   - packages/tokens/tokens.css, packages/tokens/brand/sistem_logo_horizontal_transparent.png
2. `feat(mobile): animated running-track background`
   - apps/mobile/src/components/common/TrackBackground
3. `feat(mobile): restyle login and sign-up to the track design`
   - apps/mobile/src/features/auth, apps/mobile/src/components/common/Logo/Logo.tsx
4. `docs: login design update report`
   - docs/phase-reports/design-login.md

```
git add -A -- packages/tokens/tokens.css packages/tokens/brand/sistem_logo_horizontal_transparent.png
git commit -m "feat(tokens): brand gradient, glass and track tokens"

git add -A -- apps/mobile/src/components/common/TrackBackground
git commit -m "feat(mobile): animated running-track background"

git add -A -- apps/mobile/src/features/auth apps/mobile/src/components/common/Logo/Logo.tsx
git commit -m "feat(mobile): restyle login and sign-up to the track design"

git add -A -- docs/phase-reports/design-login.md
git commit -m "docs: login design update report"
```
