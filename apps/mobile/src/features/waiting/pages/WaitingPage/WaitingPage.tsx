import { useEffect, useState } from 'react';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Logo } from '../../../../components/common/Logo/Logo';
import { LogoutButton } from '../../../../components/common/LogoutButton/LogoutButton';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import { useAuth } from '../../../../services/auth/AuthContext';
import { getWaitingStatus } from '../../../../services/waiting/waitingService';
import { Countdown } from '../../components/Countdown/Countdown';
import { IconSlot } from '../../components/IconSlot/IconSlot';
import { WAITING_COPY } from '../../data/waitingCopy';
import { WAITING_ICONS } from '../../data/waitingIcons';
import './WaitingPage.css';

// How often the screen asks the server whether the plan was published. Phase 5 adds
// the push notification; the poll stays as the fallback while the app is open.
const POLL_INTERVAL_MS = 30_000;
const TICK_INTERVAL_MS = 1000;

// One server answer, pinned to the device's monotonic clock (performance.now()).
// The countdown only ever adds elapsed time to the server's "now", so a wrong or
// changed device clock cannot move it (PRD §11: the server is the source of truth).
interface ServerClock {
  dueAtMs: number;
  serverNowMs: number;
  receivedAt: number;
}

function remainingMsFrom(clock: ServerClock): number {
  return clock.dueAtMs - (clock.serverNowMs + (performance.now() - clock.receivedAt));
}

/** "Your plan is being built" (PRD §4.1): full screen, no tab bar, until a plan is published. */
export function WaitingPage() {
  const { updateUser } = useAuth();
  const [clock, setClock] = useState<ServerClock | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  // Poll on mount, on an interval, and whenever the app comes back to the foreground
  // (which also re-syncs the clock after the device slept).
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const status = await getWaitingStatus();
        if (cancelled) return;

        if (status.appState !== 'waiting') {
          // The plan is published: AppStateGuard follows the new state to Home.
          updateUser({ appState: status.appState });
          return;
        }

        if (status.planDueAt) {
          const nextClock: ServerClock = {
            dueAtMs: new Date(status.planDueAt).getTime(),
            serverNowMs: new Date(status.serverTime).getTime(),
            receivedAt: performance.now(),
          };
          setClock(nextClock);
          setRemainingMs(remainingMsFrom(nextClock));
        }
      } catch {
        // Offline or a server hiccup: keep the last known clock and try again next time.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') void poll();
    }

    void poll();
    const intervalId = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // Only on mount: updateUser is a new function on every AuthProvider render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!clock) return;
    const intervalId = window.setInterval(() => setRemainingMs(remainingMsFrom(clock)), TICK_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [clock]);

  const isOverdue = remainingMs !== null && remainingMs <= 0;

  return (
    <AppShell hideTabBar>
      <div className="waiting-page">
        <Logo variant="mark" className="waiting-logo" />

        <div className="waiting-content">
          <div className="waiting-icons">
            {WAITING_ICONS.map((icon, index) => (
              <IconSlot key={icon.id} icon={icon} position={index + 1} />
            ))}
          </div>

          <h1 className="waiting-title">{WAITING_COPY.title}</h1>

          {remainingMs === null && <Spinner size="lg" />}

          {remainingMs !== null && !isOverdue && (
            <>
              <Countdown remainingMs={remainingMs} label={WAITING_COPY.countdownLabel} />
              <p className="waiting-message">{WAITING_COPY.message}</p>
            </>
          )}

          {isOverdue && <p className="waiting-message">{WAITING_COPY.overdueMessage}</p>}
        </div>

        <LogoutButton />
      </div>
    </AppShell>
  );
}
