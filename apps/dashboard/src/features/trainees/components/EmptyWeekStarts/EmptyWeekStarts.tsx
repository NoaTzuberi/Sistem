import { fill, formatPlural, formatWeekSpan, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { aiDraftCopy } from '../../../aiDraft/copy';
import { traineesCopy } from '../../copy';
import type { PlanStartMethod } from '../../hooks/useNewPlanPopover';
import type { ProgramWeek } from '../../hooks/useTraineeWeeks';
import './EmptyWeekStarts.css';

interface EmptyWeekStartsProps {
  week: ProgramWeek;
  /** The week before it (what "duplicate" copies). */
  previous: ProgramWeek | undefined;
  /** A week that is over cannot get a plan any more. */
  canStart: boolean;
  /** A ready AI draft exists. */
  hasAiDraft: boolean;
  onStart: (method: PlanStartMethod) => void;
}

/** An empty week: a quiet hello and three big ways to start it — each opens the new-plan popover on this week and method. */
export function EmptyWeekStarts({ week, previous, canStart, hasAiDraft, onStart }: EmptyWeekStartsProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const ai = useCopy(aiDraftCopy);
  const w = copy.weeks;
  const previousPlan = previous?.plan;

  return (
    <div className="pw-empty-week">
      <span className="pw-empty-icon" aria-hidden="true">
        <Icon name="calendar" />
      </span>
      <h2 className="pw-empty-title">{fill(w.emptyTitle, { number: week.number })}</h2>
      <p className="pw-empty-sub">
        <bdi>{formatWeekSpan(week.weekStartDate, language)}</bdi>
        {canStart && ` · ${w.emptyHint}`}
      </p>
      {canStart ? (
        <div className="pw-empty-starts">
          <button className="pw-start" type="button" data-kind="scratch" onClick={() => onStart('scratch')}>
            <span className="pw-start-icon" aria-hidden="true">
              <Icon name="plus" />
            </span>
            <b>{copy.startScratch}</b>
          </button>
          <button className="pw-start" type="button" data-kind="duplicate" disabled={!previousPlan} onClick={() => onStart('duplicate')}>
            <span className="pw-start-icon" aria-hidden="true">
              <Icon name="copy" />
            </span>
            <b>{fill(w.duplicateWeek, { number: previous?.number ?? '—' })}</b>
            {previousPlan && (
              <small>
                {formatPlural(language, w.workoutsCount, previousPlan.workouts.length)} · {shared.coach.planStatus[previousPlan.status]}
              </small>
            )}
          </button>
          <button className="pw-start" type="button" data-kind="ai" onClick={() => onStart('ai')}>
            <span className="pw-start-icon" aria-hidden="true">
              <Icon name="spark" />
            </span>
            <b>{ai.training.title}</b>
            {hasAiDraft && <small>{copy.aiReadyTag}</small>}
          </button>
        </div>
      ) : (
        <p className="pw-empty-sub">{w.emptyPast}</p>
      )}
    </div>
  );
}
