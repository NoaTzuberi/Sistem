# Design addition — link to the Coach Dashboard (mobile)

Follows `design-login.md`. Mobile app only: no server, auth, API or dashboard changes.

## Summary

- New optional env variable `VITE_COACH_DASHBOARD_URL` (apps/mobile). When it is empty, missing or
  not an http(s) address, both links below are hidden — nothing crashes.
- **Login screen**: a quiet text link under the glass card, "מאמנת? לכניסה לדשבורד" with a small
  arrow. Login only (not on Sign-up). It sits inside the element the entrance timeline animates,
  so it rises and fades in together with the card.
- **Coach Profile** (coach mode): a row "פתחי את הדשבורד המלא" with an external-link icon.
- Both open the address through one helper, `openExternal(url)` — a new browser tab for now, with
  a `TODO(5b)` for `@capacitor/browser` at its single call site.

## What changed

- `app/config/env.ts` (new) — `COACH_DASHBOARD_URL`: the trimmed value, or `null`. The brief says
  "the app's existing config module"; there was none for env values (only `app/config/routes.ts`),
  so this small file was added next to it. `VITE_API_URL` is still read where it was.
- `services/external/openExternal.ts` (new) — `window.open(url, '_blank', 'noopener,noreferrer')`.
- `features/auth/components/CoachDashboardLink` (new) — an `<a>` with the real `href` (so it is
  a link for screen readers and long-press), whose click goes through `openExternal`.
  Style (made bolder at the owner's request): full white, 16px, weight 700, 44px tall;
  underline only on press / keyboard focus; no hover style.
  The arrow has `flip-rtl` (points left in Hebrew, right in English).
- `AuthScreen` — new optional `footer` prop, rendered between the card and the language switch.
  `Login` passes the link; `Register` passes nothing.
- `features/coach/components/DashboardLinkRow` (new) — the row on `CoachProfilePage`, above the
  language switch. The external-link icon is not mirrored.
- Copy keys added (he + en): `authCopy.coachDashboardLink`, `coachCopy.openFullDashboard`.

**Who sees the row**: `CoachProfilePage` is routed only inside `AppStateGuard allow={['coach']}`
(the server-decided `appState`). A trainee's Profile is a different page (`features/profile`),
which was not touched.

## Files changed

Added
- apps/mobile/src/app/config/env.ts
- apps/mobile/src/services/external/openExternal.ts
- apps/mobile/src/features/auth/components/CoachDashboardLink/CoachDashboardLink.tsx + .css
- apps/mobile/src/features/coach/components/DashboardLinkRow/DashboardLinkRow.tsx + .css
- docs/phase-reports/design-coach-link.md

Modified
- apps/mobile/.env.example
- apps/mobile/src/features/auth/components/AuthScreen/AuthScreen.tsx
- apps/mobile/src/features/auth/pages/Login/Login.tsx
- apps/mobile/src/features/auth/copy/he.ts, en.ts
- apps/mobile/src/features/coach/copy/he.ts, en.ts
- apps/mobile/src/features/coach/pages/CoachProfilePage/CoachProfilePage.tsx

Deleted: none.

## Dependencies

None added or removed.

## How to test

```
npm run lint          # passes (i18n audit clean; the two old AuthContext warnings)
npm run test:i18n     # passes (he / en keys match)
npm run dev:all       # server + mobile (5173) + dashboard (5174)
```

Add to `apps/mobile/.env` (restart the dev server after changing it):
`VITE_COACH_DASHBOARD_URL=http://localhost:5174`

1. **Login, variable set** — http://localhost:5173/login: the link shows under the card, above
   the language switch. Reload: it fades in with the card, not before. Tap: the dashboard opens
   in a new tab; the app stays on Login.
2. **Sign-up** (`/register`): no link.
3. **English**: switch language — the text changes and the arrow points right.
4. **Keyboard**: Tab to the link — underline + focus ring. Press and hold on a phone — underline.
5. **Coach row**: log in as `coach@sistem.dev` → Profile tab: the row shows; tap opens the
   dashboard in a new tab.
6. **Trainee**: log in as `trainee2@sistem.dev` → Profile and Settings: no such row. Typing
   `/coach/profile` by hand sends her back to her own screen.
7. **Variable missing**: remove the line from `apps/mobile/.env` (or leave the value empty),
   restart: no link on Login, no row on the coach's Profile, no console error. The same happens
   with a value that is not a web address (for example `dashboard`).
8. iPhone SE size: the Login screen still scrolls; the link does not push the card.

What was checked here: lint, the copy parity test and the TypeScript check of these files.
**Nothing was watched in a browser** (no browser was connected in this session) — the look, the
fade-in and the two taps still need the manual checks above.

## Known issues / TODOs

1. **`npm run build -w @sistem/mobile` fails right now, not from this change.** The two errors
   are in `features/waiting/pages/WaitingPage/WaitingPage.tsx` (missing `useFloatingIcons`,
   missing `unitLabels` prop) — waiting-screen work that is in progress in the working tree.
   The files of this change have no type errors.
2. No token was added: the first version's `--color-on-brand-muted` was removed with the bolder style.
3. **English copy is a placeholder**: "Coach? Go to the dashboard" and "Open the full
   dashboard". The Hebrew is the owner's wording.
4. **Production value**: set `VITE_COACH_DASHBOARD_URL` in the mobile app's hosting settings
   (Vercel) to the deployed dashboard address. Until then the links stay hidden there.
5. **Phase 5b**: `openExternal` uses `window.open`; swap in `@capacitor/browser` at the
   `TODO(5b)`. There is no terms line on the Login screen yet; when one is added it goes under
   this link.
6. The coach's Profile is still the placeholder page ("coming soon"); the row uses a plain
   bordered style until that screen is designed.

## Suggested commits

1. `feat(mobile): link to the coach dashboard from login and coach profile`
2. `docs: coach dashboard link report`

```
git add -A -- apps/mobile/.env.example apps/mobile/src/app/config/env.ts apps/mobile/src/services/external apps/mobile/src/features/auth/components/CoachDashboardLink apps/mobile/src/features/auth/components/AuthScreen/AuthScreen.tsx apps/mobile/src/features/auth/pages/Login/Login.tsx apps/mobile/src/features/auth/copy apps/mobile/src/features/coach/components/DashboardLinkRow apps/mobile/src/features/coach/copy apps/mobile/src/features/coach/pages/CoachProfilePage/CoachProfilePage.tsx
git commit -m "feat(mobile): link to the coach dashboard from login and coach profile"

git add -A -- docs/phase-reports/design-coach-link.md
git commit -m "docs: coach dashboard link report"
```
