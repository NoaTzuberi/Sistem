# Deploy — server on Render (free tier)

Date: 2026-10-13. Checklist for the owner: `docs/deploy/render.md`.

## Summary

`apps/server` is ready to run on Render so the GitHub Pages front ends have an API. The server
already listened on `PORT` and already had build / start scripts; what changed is the CORS
allow-list (`CLIENT_ORIGINS`), the health answer (`{ ok: true }`), a Render Blueprint
(`render.yaml`), and a way to create the demo accounts with a password that is not in the repo
(`SEED_PASSWORD`). Nothing was deployed: the Render, Atlas and GitHub steps are the owner's, in
the checklist. No secret value was read into a file, printed or committed.

## What was checked and left alone

- **Port** — `config.port = Number(process.env.PORT) || 5002`, `app.listen(config.port)`. Unchanged.
- **Start script** — `build: tsc`, `start: node dist/server.js` (`apps/server/package.json`). Unchanged.
- **Auth** — a `Authorization: Bearer <token>` header (`middleware/auth.middleware.ts`,
  `packages/api-client/src/createApiClient.ts`). No cookies anywhere, so there is no
  `SameSite` / `Secure` setting to make and CORS sends no `credentials` header. Unchanged.

## What changed

1. **CORS** — `apps/server/src/config/clientOrigins.ts` (`parseClientOrigins`, pure): reads
   `CLIENT_ORIGINS`, comma-separated; keeps only the origin of each entry (a pasted
   `https://name.github.io/sistem/` becomes `https://name.github.io`); drops `*` and anything
   that is not an http(s) address. Unset: `http://localhost:5173` + `:5174` in development,
   **nothing** in production (with a startup warning). `app.ts` passes the list to `cors()`.
   The old `CLIENT_ORIGIN` (one value, default `*`) is gone.
2. **Health** — `GET /api/health` answers `200 { ok: true }` (was `status` / `uptime` / `timestamp`;
   nothing read those). No database call.
3. **`render.yaml`** — one free Node web service, `sistem-api`, Frankfurt, branch `main`.
   - No `rootDir`: the monorepo has one lockfile at the root, so the install must run there.
   - Build: `MONGOMS_DISABLE_POSTINSTALL=1 npm ci --include=dev && npm run build -w @sistem/server`
     (`--include=dev` because `NODE_ENV=production` would skip TypeScript; the flag stops the test
     database binary from being downloaded on every build).
   - Start: `node apps/server/dist/server.js`. Health check: `/api/health`.
   - Keys only (`sync: false`): `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`,
     `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, `VOYAGE_API_KEY`,
     `GEMINI_API_KEY`, `CLIENT_URL`, `EMAIL_FROM`, `DEFAULT_COACH_EMAIL`.
   - With a value (none is a secret): `NODE_ENV=production`, `NODE_VERSION=22`,
     `CLIENT_ORIGINS=https://noatzuberi.github.io`, `AI_PAID_TIER=false`,
     `FEATURE_NUTRITION_RECIPES=false`, `FEATURE_WATER_TRACKING=false`.
   - Not listed: `PORT` (Render sets it), `AI_MODEL` / `AI_FALLBACK_MODEL` (empty = the defaults).
4. **`.gitignore`** — the `render.yaml` line was removed: a Blueprint has to be in the repo.
   (It was ignored since the old ATLAS file was removed on 2026-09-27.)
5. **`apps/server/.env.example`** — `CLIENT_ORIGINS` replaces `CLIENT_ORIGIN`; the path in the first
   line is corrected; `KAGGLE_API_TOKEN` (added earlier, not yet committed) is in the same file.
6. **Demo accounts** — `seed:dev` reads `SEED_PASSWORD` (12+ characters) for the accounts it
   creates and never prints it; without it the built-in dev password is used as before.
   Existing accounts are still left unchanged.

## Decisions I made — please check

1. **`CLIENT_ORIGINS` has its value in `render.yaml`** (`https://noatzuberi.github.io`, from
   `SITE_ORIGIN` in the deploy workflow) instead of `sync: false`: it is public and easy to
   mistype. Localhost is allowed only in development, not on Render.
2. **The AI stays off on Render** (`AI_PAID_TIER=false`): the provider is Gemini's free tier and
   PRD §14 forbids real trainee data there. `GEMINI_API_KEY` / `VOYAGE_API_KEY` are listed because
   they were asked for, but nothing reads them in production until a paid tier is set.
3. **`SEED_PASSWORD` is optional**, so `npm run seed:dev -- --allow-remote` on the development
   database works as before. The checklist always sets it for production.
4. **Region Frankfurt** (closest to Israel). **`JWT_SECRET` is typed by hand** (`sync: false`, as
   asked); Render could also generate it.

## Files

Added:
- `render.yaml`
- `apps/server/src/config/clientOrigins.ts`
- `apps/server/src/config/__tests__/clientOrigins.test.ts`
- `docs/deploy/render.md`
- `docs/phase-reports/deploy-render.md`

Modified:
- `apps/server/src/app.ts`, `apps/server/src/config/env.ts`
- `apps/server/src/features/health/health.controller.ts`
- `apps/server/src/features/users/scripts/seedDev.ts`
- `apps/server/.env.example`, `.gitignore`, `README.md`

Deleted: none.

`CLAUDE.md` (gitignored, not in any commit) now names `CLIENT_ORIGINS`.

## Dependencies

None added or removed.

## How to test

```bash
npm run build        # every app
npm test             # server: 42 files / 598 tests; copy + client: 3 files / 29 tests
npm run lint
```

All three pass on the current tree. Checked by hand against the built code, with
`CLIENT_ORIGINS=https://noatzuberi.github.io` in production mode:

- `GET /api/health` → `200 {"ok":true}`;
- origin `https://noatzuberi.github.io` → `Access-Control-Allow-Origin` is that origin;
- origins `https://evil.example` and `http://localhost:5173` → no CORS header;
- the preflight for `authorization, content-type, accept-language` → `204`, allowed;
- no `Access-Control-Allow-Credentials` header in any answer.

Local run: `npm run dev:all` — both apps still log in (their origins are the development default).
If your `apps/server/.env` sets `CLIENT_ORIGINS`, it must list every address you open the apps from.

Not tested: the build and start on Render itself, and the Blueprint file in Render's own check.

## Known issues / TODOs

1. **Use a separate production database.** The development `DATABASE_URL` points to a hosted
   database; if the `@sistem.dev` seed accounts are in it they have the public dev password, and
   `SEED_PASSWORD` does not change existing accounts.
2. **Password-reset links do not fit the Pages site**: the server builds
   `CLIENT_URL/reset-password?token=…`, and the Pages build uses hash routes (`/#/…`). Reset is
   backlog; fix it when it is built.
3. **Optional keys in the Blueprint**: I am not sure Render accepts an empty value for a
   `sync: false` key when the Blueprint is created. If it does not, delete the key in the dashboard.
4. **The dev password is still public** in `README.md`, `seedDev.ts` and older phase reports — fine
   for local work, never for a database behind a public server.
5. **Demo accounts are shared**: anyone with the password can change them, and the demo coach sees
   every guest who signs up while she is the only coach (`docs/deploy/render.md` §6).
6. **Free tier**: the service sleeps after about 15 minutes idle; the first request takes up to
   about a minute.
7. Other uncommitted work in the tree (plan builder, trainee profile, the `@dnd-kit` removal) is
   not part of the commands below.

## Suggested commits

1. `feat(server): CORS allow-list from CLIENT_ORIGINS and a plain health answer`
2. `feat(server): seed:dev takes its password from SEED_PASSWORD`
3. `chore: Render Blueprint for the server`
4. `docs: Render deploy checklist and report`

```bash
git add -A -- apps/server/src/config/clientOrigins.ts apps/server/src/config/__tests__/clientOrigins.test.ts apps/server/src/config/env.ts apps/server/src/app.ts apps/server/src/features/health/health.controller.ts
git commit -m "feat(server): CORS allow-list from CLIENT_ORIGINS and a plain health answer"

git add -A -- apps/server/src/features/users/scripts/seedDev.ts
git commit -m "feat(server): seed:dev takes its password from SEED_PASSWORD"

git add -A -- render.yaml .gitignore apps/server/.env.example
git commit -m "chore: Render Blueprint for the server"

git add -A -- docs/deploy/render.md docs/phase-reports/deploy-render.md README.md
git commit -m "docs: Render deploy checklist and report"
```
