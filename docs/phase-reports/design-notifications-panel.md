# Design update — notifications panel (the bell's dropdown)

Reference: `docs/design/coach-dashboard.html` → the bell in the top line (visual reference only;
none of its notifications, names or times were shipped).

## Summary

The bell now opens an Apple-style panel: frosted glass under the bell over a light blurred scrim,
a header with the unread count, "mark all as read" and an "all / unread" segmented control,
notifications grouped into "needs attention / today / earlier", and typed cards with clear read
and unread states. It is a modal dialog (Esc, focus in and back, Tab stays inside). The server's
notifications and its mark-read API are used as they are; the 48h-window alerts are made in the
browser. No server, API, schema or dependency change.

## What changed

**Overlay** — a full-screen scrim (10% ink + 6px blur) that fades in 200ms; pressing it closes
the panel. The panel hangs under the bell: `min(420px, 100vw − 24px)` wide, at most
`min(680px, 100vh − 96px)` high, radius 30, frosted (86% snow, blur 30px, saturate 180%), a
hairline ring and a large soft shadow. It enters with opacity + `translateY(-6px) scale(.96)` → 1
in 240ms on the ease-out curve, from the bell's corner. At ≤ 640px it spans the screen with 12px
insets, from 64px down.

**Accessibility** — `role="dialog"`, `aria-modal`; the bell has `aria-expanded` and
`aria-controls`; Esc closes; on open the focus moves into the panel, on close it returns to the
bell; Tab and Shift+Tab stay inside.

**Header** — "התראות" (24px, semibold) + "N חדשות"; "סימון הכול כנקרא" as a pink text button,
disabled when nothing is unread; an iOS-style segmented control "הכול / לא נקראו · N" whose white
thumb slides by `transform`. The unread filter's empty state: "הכול נקרא" / "אין התראות חדשות כרגע".

**Groups** — "דורש טיפול" (always first), "היום", "מוקדם יותר", each with a small muted heading.
Times: "עכשיו" under a minute, relative up to six hours ("לפני 2 שע׳"), the clock time for the
rest of today, a short date before that.

**A notification** (`NotificationItem`) — a 40px icon tile, the title, the time, the body, and an
action button where there is one.
- Unread: white card, radius 20, soft shadow, a blurred glow in its type's color at the
  reading-start side, semibold title, an 8px dot in the type's color at the far end.
- Read: flat (45% white), no shadow, no glow, a grey icon tile, a medium-weight quieter title, no dot.
- Pressing it (click, Enter or Space) marks it read at once and goes to its screen.
- ✕ (a small grey circle at the far end): shown under the pointer or on keyboard focus, always
  on touch. The card fades and shrinks, then is removed.

**Bell** — the dot shows only while something is unread; `aria-label` = "התראות, N חדשות". Mark-read
updates the badge at once (and is undone with an error line if the server refuses).

## Types — what exists and where it comes from

| Type | Color | Source | Shown as |
|---|---|---|---|
| **warn** — her 48h window is closing | orange `#C75A00` | made in the browser (see below) | "נותרו 7 שע׳ 38 דק׳ · {name}" · "חלון 48 השעות נסגר ב־{day, time}" · "בניית תוכנית" |
| **late** — the window has passed | red `#D70015` | made in the browser | "באיחור של … · {name}" · "חלון 48 השעות עבר" · "בניית תוכנית" |
| **new** — a new trainee | lilac `#7C4DFF` | the server's `trainee_onboarded` | "מתאמנת חדשה: {name}" · "מילאה שאלון ומחכה לתוכנית" (only while she is still waiting) |
| **done** — a workout completed | Cherry Rose | the server's `workout_completed` | "{name} סיימה את {workout}" · her week ("2 מתוך 4 אימונים הושלמו.") for a workout finished today |
| **msg** — a message | — | **not built: there is no messaging** | — |

**The 48h alerts are generated on the client.** The server has no notification for a closing or
passed window, so they are derived from data the dashboard already has: the trainees list
(`planDueAt`) and the server's clock (`useServerNow`), with the same 12-hour threshold the
trainees table already calls urgent. "בניית תוכנית" opens her Plans tab with the "new plan"
popover. A late alert stays unread and cannot be dismissed; it disappears when her plan is
published (her deadline is gone). A push / email for these would need a server-side notification —
not part of this.

## Skipped — no data source

1. **Messages (msg)** — no messaging feature, so no type, quote bubble or "תשובה".
2. **The footer "לכל ההתראות"** — the dashboard has no notifications page to go to. The panel
   shows the 30 newest.
3. **A progress line for older "workout completed" items** — a notification stores no week
   numbers. The line is her week *as it stands now*, so it is shown only next to a workout
   finished today.

## Decisions I made — please check

1. **"Dismiss" is per browser.** The server has no delete for notifications. ✕ marks the
   notification read on the server (the existing API) and hides it in this browser
   (`localStorage`, the newest 200 ids). On another computer it appears as read, not gone.
2. **A warn alert's "read" is per browser too** (the server does not know the alert). Pressing it,
   or "mark all as read", marks it; it comes back unread only as a *late* alert.
3. **The bell's count** = the server's unread count + the unread window alerts.
4. **The alert titles use the existing time wording** — "נותרו 7 שע׳ 38 דק׳ · name" / "באיחור של
   243 שע׳ 16 דק׳ · name" (the same text as the trainees table and the profile), not the brief's
   "עוד X שעות" / "באיחור · name".
5. **Red is used for one thing only**: a passed window (`--color-notice-late`). The bell's dot
   stays the brand pink it already was.
6. **The segmented control is a new small component** (`FilterSegment`, two options, sliding
   thumb). The existing `SegmentedControl` (Statistics' 3 / 6 / 12 months) was left as it is.
7. **Old notifications of trainees who are no longer waiting** show "מתאמנת חדשה: name" without
   the "waiting for a plan" line — it would not be true any more.
8. **Read-state transitions** (background, shadow, glow opacity) are named properties, 200ms; the
   press is transform only; under reduced motion only opacity changes.
9. The panel is `position: absolute` under the bell (no measured coordinates, so no inline
   style); on a phone it is `position: fixed` with the insets from the brief.

## New tokens (`packages/tokens/tokens.css`)

Colors / surfaces: `--color-notice-warn` (= the existing orange), `--color-notice-late` (#D70015,
new), `--color-notice-new` (= the workout lilac), `--color-notice-done` (= Cherry Rose),
`--surface-notice-panel`, `--surface-notice-read`, `--surface-notice-quiet`, `--color-notice-scrim`,
`--blur-notice-scrim`, `--blur-notice-panel`.
Shadows: `--shadow-notice-panel`, `--shadow-notice-card`, `--shadow-notice-icon`,
`--shadow-segment-thumb`.
Shape / type: `--radius-notice-panel` (30px), `--radius-notice-icon` (13px), `--radius-segment`
(9px), `--text-panel-title` (24px).
Motion / layers: `--transition-notice-panel` (240ms), `--transition-notice` (200ms),
`--transition-segment` (220ms), `--z-notifications`.

## i18n keys (he + en; English is placeholder)

New folder `features/notifications/copy`: `bellLabel` (plural), `newCount` (plural),
`filterLabel`*, `filterAll`, `filterUnread`, `filterUnreadCount`, `allReadTitle`, `allReadBody`,
`groupAttention`, `groupToday`, `groupEarlier`, `now`, `windowTitle`, `windowCloses`,
`waitingForPlan`, `dismiss`*.
\* = my placeholder wording; the rest is the brief's / the reference's Hebrew.
Reused as they were: the notifications' sentences (`coachNotifications.*`), "התראות", "סימון הכול
כנקרא", the empty and error lines (`coach.inbox.*`), "חלון 48 השעות עבר", "בניית תוכנית", the
time-left wording.
No longer used by the dashboard: `coach.inbox.bellUnread` (shared copy — left in place; the
mobile app may use it).

## Files

Added (each component = `.tsx` + `.css` in its own folder)
- `apps/dashboard/src/features/notifications/components/`: `NotificationsPanel/`,
  `NotificationItem/`, `FilterSegment/`
- `apps/dashboard/src/features/notifications/hooks/`: `useNotifications.ts`,
  `useNotificationsPanel.ts`
- `apps/dashboard/src/features/notifications/data/`: `notificationItems.ts`, `notificationStore.ts`
- `apps/dashboard/src/features/notifications/copy/`: `he.ts`, `en.ts`, `index.ts`
- `docs/phase-reports/design-notifications-panel.md`

Modified
- `packages/tokens/tokens.css`
- `apps/dashboard/src/features/notifications/components/NotificationBell/` (.tsx + .css) — now
  only the bell button; its data and panel logic moved to the hooks.

Deleted: nothing (the old panel was inside `NotificationBell`).

## Dependencies

None added or removed.

## How to test

```
npm run build -w @sistem/dashboard   # passes
npm run lint                         # passes (i18n audit clean; the known fast-refresh warnings)
npm run test:i18n                    # passes (30 — the new copy folder is in the parity test)
npm run dev:all                      # http://localhost:5174, seed coach: coach@sistem.dev
```

1. **Bell** — the dot and "התראות, N חדשות" while something is unread; no dot at 0.
2. **Open** — the page dims and blurs lightly, the panel settles under the bell; the focus is in
   the panel; press the scrim / Esc: it closes and the focus is on the bell.
3. **0 / 1 / many unread** — the count next to the title and in "לא נקראו · N" follow; at 0 the
   count is gone, the segment reads "לא נקראו", and "סימון הכול כנקרא" is disabled.
4. **Filter** — "לא נקראו": the thumb slides, only unread cards remain; when none: "הכול נקרא /
   אין התראות חדשות כרגע".
5. **Groups** — the 48h alerts under "דורש טיפול" first; today's and older notifications under
   their headings; the times as described above.
6. **Read vs unread** — an unread card is white with its colored glow and dot; press it: the
   badge drops at once and the app goes to her page; reopen: the card is flat and grey-iconed.
7. **48h alerts** — a trainee with ≤ 12h left: an orange card with the time left, when it closes,
   and "בניית תוכנית" (→ her Plans tab with the new-plan popover). A passed window: a red card,
   no ✕, still unread after "mark all as read"; publish her plan and it is gone.
8. **Dismiss** — hover a card: ✕ appears; press it: the card fades out and is removed, the badge
   drops; reload: it stays hidden in this browser.
9. **Mark all as read** — every card turns flat except the late ones; the count becomes the number
   of late alerts.
10. **Long title / bidi** — a long workout name wraps under the title without pushing the time
    off; a Hebrew sentence with an English trainee name keeps its order ("מתאמנת חדשה: test10").
11. **Keyboard only** — Tab to the bell, Enter; Tab through "mark all", the two segments, the
    cards (each card, then its action and its ✕); Enter / Space on a card opens it; Shift+Tab at
    the top goes to the last control; Esc.
12. **390px** — the panel spans the screen 12px from each side, from 64px; no sideways scroll; the
    ✕ is always visible on a touch device.
13. **he ↔ en** — mirrored; the panel hangs from the bell's side; the thumb slides the other way.
14. **Reduced motion** — the panel and the scrim only fade; cards do not shrink; the thumb jumps.

Checked here, in Chrome as the seed coach (scripted): 1 (label and dot at 14, 13, 12 unread); 2
(dialog attributes, focus into the panel, Esc and scrim close, focus back, `aria-expanded`); the
panel's size and position (420px, under the bell, on screen, not covered); 4 (filter and thumb);
5 (attention and "earlier" groups); 6 (Enter on a card: read at once, navigated, the badge 13 →
12; read cards render flat); 7 (seven late cards without ✕, one orange warn card with its closing
time and action); 8 (✕: leaving state, removed, badge 14 → 13, id stored); 12 in a 390px frame
(12–378px, from 64px, no sideways scroll).
**Not checked:** 3 at exactly 0 and 1; the unread filter's empty state; 9 ("mark all as read" was
not pressed — it would mark every dev notification read for good; its code path is the optimistic
update + the existing call); 10 with a really long title; the Tab trap with a real keyboard (a
scripted Tab cannot move focus); "today" items (the dev data has none from today); 13 (English);
14; the ✕ on a real touch device; Safari / Firefox (`backdrop-filter`).
Side effects of the check on the dev database: two of the seed coach's notifications were marked
read (one dismissed, one opened). The dismissed id was removed from this browser's storage again.

## Known issues / TODOs

1. The three skipped items and the nine decisions above.
2. Window alerts follow the trainees list, which reloads on page changes — an alert can appear or
   turn late up to one navigation late; the time inside it ticks with the server clock.
3. With many alerts (the dev data has seven overdue test trainees) "דורש טיפול" fills the panel
   before any other notification is visible; the list scrolls.
4. The panel shows the 30 newest server notifications; there is no "load more" (and no page to
   go to).
5. Mobile coach mode's Inbox is unchanged (it has no window alerts).
6. CLAUDE.md was not updated (the notifications paragraph still describes the old bell) — say if
   you want it brought up to date.
7. Not mine, left untouched: `apps/dashboard/package.json`, `package-lock.json`,
   `apps/server/.env.example`, `packages/api-client/src/createApiClient.ts`,
   `docs/design/coach-dashboard.html`, `apps/mobile/**`.

## Suggested commits

1. `feat(tokens): notifications panel tokens (types, frosted panel, segment thumb)`
2. `feat(dashboard): notifications panel — typed cards, read / unread, 48h window alerts`
3. `docs: notifications panel design report`

```
git add -A -- packages/tokens/tokens.css
git commit -m "feat(tokens): notifications panel tokens (types, frosted panel, segment thumb)"

git add -A -- apps/dashboard/src/features/notifications
git commit -m "feat(dashboard): notifications panel — typed cards, read / unread, 48h window alerts"

git add -A -- docs/phase-reports/design-notifications-panel.md
git commit -m "docs: notifications panel design report"
```
