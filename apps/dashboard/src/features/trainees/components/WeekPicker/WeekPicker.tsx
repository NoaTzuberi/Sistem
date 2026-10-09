import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PlanWeekOption, PlanWeekOptions, Language } from '@sistem/types';
import { fill, formatWeekSpan, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { planPath } from '../../../../app/config/routes';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import './WeekPicker.css';
import { traineesCopy } from '../../copy';

export type WeekPickerMode = 'new' | 'duplicate';

interface WeekPickerProps {
  traineeId: string;
  mode: WeekPickerMode;
  /** From the server: the weeks (this week onwards), their plans and the defaults. */
  options: PlanWeekOptions;
  isCreating: boolean;
  onConfirm: (weekStartDate: string) => void;
  onCancel: () => void;
}

function weekLabel(week: PlanWeekOption, language: Language): string {
  const span = formatWeekSpan(week.weekStartDate, language);
  return week.relation === 'later' ? span : `${sharedCopy[language].weekRelation[week.relation]} · ${span}`;
}

function statusLabel(week: PlanWeekOption, language: Language): string | null {
  if (!week.plan) return null;
  return sharedCopy[language].coach.planStatus[week.plan.status];
}

/**
 * Explicit week choice for "New plan" and "Duplicate last week". This week and next
 * week come first; later weeks sit behind "Later…". A week that already has a plan is
 * offered as "Open", never replaced by another week behind the coach's back.
 */
export function WeekPicker({ traineeId, mode, options, isCreating, onConfirm, onCancel }: WeekPickerProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const defaultWeek = mode === 'new' ? options.defaultNewWeek : options.defaultDuplicateWeek;
  const [selected, setSelected] = useState(defaultWeek);
  const [showLater, setShowLater] = useState(false);

  const firstWeeks = options.weeks.filter((week) => week.relation !== 'later');
  const laterWeeks = options.weeks.filter((week) => week.relation === 'later');
  const selectedWeek = options.weeks.find((week) => week.weekStartDate === selected);
  const visibleWeeks = showLater || selectedWeek?.relation === 'later' ? options.weeks : firstWeeks;

  return (
    <fieldset className="week-picker">
      <legend className="week-picker-title">{(mode === 'new' ? copy.pickNewTitle : copy.pickDuplicateTitle)}</legend>

      <ul className="week-picker-list">
        {visibleWeeks.map((week) => {
          const status = statusLabel(week, language);
          return (
            <li key={week.weekStartDate}>
              <label className="week-picker-option">
                <input
                  type="radio"
                  name="plan-week"
                  value={week.weekStartDate}
                  checked={selected === week.weekStartDate}
                  onChange={() => setSelected(week.weekStartDate)}
                />
                <span className="week-picker-label">{weekLabel(week, language)}</span>
                {status && week.plan && (
                  <>
                    <Badge tone={week.plan.status === 'published' ? 'accent' : 'neutral'}>{status}</Badge>
                    <Link className="week-picker-open" to={planPath(traineeId, week.plan.id)}>
                      {copy.open}
                    </Link>
                  </>
                )}
              </label>
            </li>
          );
        })}
      </ul>

      {visibleWeeks.length < options.weeks.length && laterWeeks.length > 0 && (
        <button className="week-picker-later" type="button" onClick={() => setShowLater(true)}>
          {copy.later}
        </button>
      )}

      {selectedWeek && (
        <div className="week-picker-footer">
          {selectedWeek.plan ? (
            <>
              <p className="week-picker-note">
                {fill(copy.weekTaken, { week: weekLabel(selectedWeek, language), status: statusLabel(selectedWeek, language) ?? '' })}
              </p>
              <Link className="week-picker-open week-picker-open-primary" to={planPath(traineeId, selectedWeek.plan.id)}>
                {copy.openPlan}
              </Link>
            </>
          ) : (
            <>
              {mode === 'duplicate' && (
                <p className="week-picker-note">
                  {selectedWeek.copiesFromWeek
                    ? fill(copy.copiesFrom, { week: formatWeekSpan(selectedWeek.copiesFromWeek, language) })
                    : copy.nothingToCopy}
                </p>
              )}
              <Button
                variant="primary"
                disabled={isCreating || (mode === 'duplicate' && !selectedWeek.copiesFromWeek)}
                onClick={() => onConfirm(selectedWeek.weekStartDate)}
              >
                {mode === 'new' ? copy.createPlan : copy.duplicate} · {formatWeekSpan(selectedWeek.weekStartDate, language)}
              </Button>
            </>
          )}
          <Button onClick={onCancel} disabled={isCreating}>
            {shared.common.cancel}
          </Button>
        </div>
      )}
    </fieldset>
  );
}
