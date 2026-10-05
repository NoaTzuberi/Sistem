import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PlanWeekOption, PlanWeekOptions } from '@sistem/types';
import { WEEK_RELATION_LABELS, formatWeekSpan } from '@sistem/shared';
import { planPath } from '../../../../app/config/routes';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import './WeekPicker.css';

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

// Functional placeholder wording — the owner sends the final text.
const TITLES: Record<WeekPickerMode, string> = { new: 'New plan — choose the week', duplicate: 'Duplicate last week — choose the week' };

function weekLabel(week: PlanWeekOption): string {
  const span = formatWeekSpan(week.weekStartDate);
  return week.relation === 'later' ? span : `${WEEK_RELATION_LABELS[week.relation]} · ${span}`;
}

function statusLabel(week: PlanWeekOption): string | null {
  if (!week.plan) return null;
  return week.plan.status === 'published' ? 'Published' : 'Draft';
}

/**
 * Explicit week choice for "New plan" and "Duplicate last week". This week and next
 * week come first; later weeks sit behind "Later…". A week that already has a plan is
 * offered as "Open", never replaced by another week behind the coach's back.
 */
export function WeekPicker({ traineeId, mode, options, isCreating, onConfirm, onCancel }: WeekPickerProps) {
  const defaultWeek = mode === 'new' ? options.defaultNewWeek : options.defaultDuplicateWeek;
  const [selected, setSelected] = useState(defaultWeek);
  const [showLater, setShowLater] = useState(false);

  const firstWeeks = options.weeks.filter((week) => week.relation !== 'later');
  const laterWeeks = options.weeks.filter((week) => week.relation === 'later');
  const selectedWeek = options.weeks.find((week) => week.weekStartDate === selected);
  const visibleWeeks = showLater || selectedWeek?.relation === 'later' ? options.weeks : firstWeeks;

  return (
    <fieldset className="week-picker">
      <legend className="week-picker-title">{TITLES[mode]}</legend>

      <ul className="week-picker-list">
        {visibleWeeks.map((week) => {
          const status = statusLabel(week);
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
                <span className="week-picker-label">{weekLabel(week)}</span>
                {status && week.plan && (
                  <>
                    <Badge tone={week.plan.status === 'published' ? 'accent' : 'neutral'}>{status}</Badge>
                    <Link className="week-picker-open" to={planPath(traineeId, week.plan.id)}>
                      Open
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
          Later…
        </button>
      )}

      {selectedWeek && (
        <div className="week-picker-footer">
          {selectedWeek.plan ? (
            <>
              <p className="week-picker-note">
                {weekLabel(selectedWeek)} already has a {statusLabel(selectedWeek)?.toLowerCase()} plan.
              </p>
              <Link className="week-picker-open week-picker-open-primary" to={planPath(traineeId, selectedWeek.plan.id)}>
                Open plan
              </Link>
            </>
          ) : (
            <>
              {mode === 'duplicate' && (
                <p className="week-picker-note">
                  {selectedWeek.copiesFromWeek
                    ? `Copies the plan of ${formatWeekSpan(selectedWeek.copiesFromWeek)}.`
                    : 'There is no earlier plan to copy into this week.'}
                </p>
              )}
              <Button
                variant="primary"
                disabled={isCreating || (mode === 'duplicate' && !selectedWeek.copiesFromWeek)}
                onClick={() => onConfirm(selectedWeek.weekStartDate)}
              >
                {mode === 'new' ? 'Create plan' : 'Duplicate'} · {formatWeekSpan(selectedWeek.weekStartDate)}
              </Button>
            </>
          )}
          <Button onClick={onCancel} disabled={isCreating}>
            Cancel
          </Button>
        </div>
      )}
    </fieldset>
  );
}
