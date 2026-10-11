import { useEffect, useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import { Link } from 'react-router-dom';
import type { CoachTraineeSummary, CoachTraineeWeek } from '@sistem/types';
import {
  fill,
  formatTimeAgo,
  formatTimeLeft,
  formatWeekSpan,
  labelList,
  sharedCopy,
  splitLabel,
  useCopy,
  useLanguage,
} from '@sistem/shared';
import { NEW_PLAN_STATE, planPath, traineePath } from '../../../../app/config/routes';
import { Avatar } from '../../../../components/common/Avatar/Avatar';
import { Icon } from '../../../../components/common/Icon/Icon';
import { RoundButton } from '../../../../components/common/RoundButton/RoundButton';
import { Tag } from '../../../../components/common/Tag/Tag';
import { useDrawerTransition } from '../../../../hooks/useDrawerTransition';
import { useCoachData } from '../../../../services/coach/CoachDataContext';
import { traineesCopy } from '../../copy';
import { describeDaysPerWeek } from '../../data/traineeFacts';
import { DRAWER_TABS, traineeTabLabel } from '../../data/traineeTabs';
import { useTraineeDrawer } from '../../hooks/useTraineeDrawer';
import { WeekSquares } from '../WeekSquares/WeekSquares';
import './TraineeDrawer.css';

// = --transition-drawer-out: the drawer leaves the page once its slide-out is over.
const CLOSE_MS = 200;
const FOCUSABLE = 'a[href], button:not([disabled])';

/**
 * The trainee quick view: a floating drawer on the far side from the sidebar. Opens on the
 * drawer curve and closes faster; Esc and the scrim close it, and the focus goes back to what
 * opened it. Her full page stays one click away.
 */
export function TraineeDrawer() {
  const { openTraineeId, closeDrawer } = useTraineeDrawer();
  const { trainees, weekOf, nowMs } = useCoachData();
  const isOpen = openTraineeId !== null;
  const { isMounted, isShown } = useDrawerTransition(isOpen, CLOSE_MS);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // While it slides out, the drawer still shows the trainee it was opened for.
  const lastId = useRef(openTraineeId);
  if (openTraineeId) lastId.current = openTraineeId;
  const trainee = trainees.find((item) => item.id === lastId.current);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeDrawer();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer]);

  useEffect(() => {
    if (isOpen && isMounted) closeRef.current?.focus();
  }, [isOpen, isMounted]);

  // Tab stays inside the drawer while it is open (it is modal).
  function keepFocusInside(event: ReactKeyboardEvent) {
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  if (!isMounted || !trainee) return null;

  return (
    <>
      <div className={isShown ? 'drawer-scrim drawer-scrim-shown' : 'drawer-scrim'} onClick={closeDrawer} />
      <aside
        ref={panelRef}
        className={isShown ? 'trainee-drawer trainee-drawer-shown' : 'trainee-drawer'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trainee-drawer-name"
        inert={!isOpen}
        onKeyDown={keepFocusInside}
      >
        <DrawerContent trainee={trainee} week={weekOf(trainee.id)} nowMs={nowMs} closeRef={closeRef} onClose={closeDrawer} />
      </aside>
    </>
  );
}

interface DrawerContentProps {
  trainee: CoachTraineeSummary;
  week: CoachTraineeWeek | undefined;
  nowMs: number;
  closeRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

function DrawerContent({ trainee, week, nowMs, closeRef, onClose }: DrawerContentProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const plan = week?.currentPlan ?? null;
  const timeLeft = trainee.planDueAt ? formatTimeLeft(trainee.planDueAt, nowMs, language) : null;
  const progress = plan ? fill(copy.weekProgress, { done: plan.completed, planned: plan.planned }) : null;

  const meta = [
    shared.traineeStatus.labels[trainee.status],
    trainee.lastActivityAt ? fill(shared.coach.lastActivityAt, { time: formatTimeAgo(trainee.lastActivityAt, nowMs, language) }) : null,
  ].filter(Boolean);

  const facts: { label: string; value: string }[] = [
    { label: shared.onboardingSections.goals, value: labelList(week?.goals, shared.onboardingOptions.goals, language) },
    { label: shared.onboardingSections.daysPerWeek, value: week?.daysPerWeek ? describeDaysPerWeek(week.daysPerWeek) : shared.common.none },
    {
      label: copy.plan,
      value: plan
        ? [formatWeekSpan(plan.weekStartDate, language), plan.splitId ? splitLabel(plan.splitId, language) : null].filter(Boolean).join(' · ')
        : copy.noPlanThisWeek,
    },
    timeLeft ? { label: copy.timeLeft, value: timeLeft.text } : { label: copy.thisWeek, value: progress ?? shared.common.none },
  ];

  return (
    <>
      <header className="drawer-header">
        <Avatar name={trainee.name} seed={trainee.id} size="lg" />
        <div className="drawer-heading">
          <h2 className="drawer-name" id="trainee-drawer-name">
            <bdi>{trainee.name}</bdi>
          </h2>
          <p className="drawer-meta">{meta.join(' · ')}</p>
        </div>
        <RoundButton ref={closeRef} label={shared.common.close} onClick={onClose}>
          <Icon name="close" size="sm" />
        </RoundButton>
      </header>

      {/* Links, not tabs: each one opens that section of her full page. */}
      <nav className="drawer-tabs" aria-label={shared.coach.sectionsLabel}>
        {DRAWER_TABS.map((tab) => (
          <Link key={tab} className="drawer-tab" to={traineePath(trainee.id, tab)}>
            {traineeTabLabel(tab, copy, shared)}
          </Link>
        ))}
      </nav>

      <div className="drawer-body">
        {trainee.needsNextWeekPlan && (
          <p className="drawer-flags">
            <Tag tone="accent">{shared.traineeStatus.needsNextWeek}</Tag>
          </p>
        )}
        <dl className="drawer-facts">
          {facts.map((fact) => (
            <div key={fact.label} className="drawer-fact">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        {plan && plan.planned > 0 && (
          <section className="drawer-section">
            <h3 className="drawer-section-title">{copy.thisWeek}</h3>
            <WeekSquares workouts={plan.workouts} label={progress ?? ''} />
            <p className="drawer-section-text">{fill(copy.weekSummary, { done: plan.completed, planned: plan.planned })}</p>
          </section>
        )}
      </div>

      <footer className="drawer-footer">
        <Link className="drawer-secondary" to={traineePath(trainee.id)}>
          {copy.fullProfile}
        </Link>
        {plan ? (
          <Link className="drawer-primary" to={planPath(trainee.id, plan.id)}>
            {copy.openWeekPlan}
          </Link>
        ) : (
          <Link className="drawer-primary" to={traineePath(trainee.id, 'plans')} state={NEW_PLAN_STATE}>
            {copy.buildPlan}
          </Link>
        )}
      </footer>
    </>
  );
}
