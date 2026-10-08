import type { FoodGroup, MealLogDay, PortionGroup } from '@sistem/types';
import { FOOD_GROUP_LABELS, PORTION_GROUPS, VEGETABLES_FREE_LABEL, describePortion, formatDateOnly } from '@sistem/shared';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { circlesFor, hasHalfMark, tapCircle, toggleHalf, withGroup } from '../../data/portionCircles';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import type { TrackerSync } from '../../hooks/useMealTracker';
import './PortionTracker.css';

interface PortionTrackerProps {
  days: MealLogDay[];
  date: string;
  today: string;
  onSelectDate: (date: string) => void;
  onChange: (date: string, eaten: MealLogDay['eaten']) => void;
  onOpenSwaps: (group: FoodGroup) => void;
  vegetablesFree: boolean;
  hasVegetableSwaps: boolean;
  sync: TrackerSync;
  offline: boolean;
}

const weekdayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'narrow', timeZone: 'UTC' });

function weekdayOf(date: string): string {
  return weekdayFormat.format(new Date(`${date}T00:00:00Z`));
}

/**
 * The day header and tracker (PRD §5.6, 13a+): per group the day's total (a button to its
 * swaps) and one circle per planned portion — tap = one portion, tap a marked one = undo,
 * "½" for half a portion. Never more than planned; no calories; nothing about what she ate.
 */
export function PortionTracker(props: PortionTrackerProps) {
  const { days, date, today, onSelectDate, onChange, onOpenSwaps, vegetablesFree, hasVegetableSwaps, sync, offline } = props;
  const index = days.findIndex((day) => day.date === date);
  const day = days[index];
  if (!day) return null;
  const hasPlan = day.planVersion !== null && PORTION_GROUPS.some((group) => day.planned[group] > 0);
  const canEdit = day.editable && hasPlan;

  function set(group: PortionGroup, value: number) {
    onChange(day.date, withGroup(day.eaten, group, value));
  }

  return (
    <section className="portion-tracker" aria-labelledby="portion-tracker-title">
      <div className="portion-tracker-nav">
        <button
          type="button"
          className="portion-tracker-arrow"
          onClick={() => onSelectDate(days[index - 1].date)}
          disabled={index <= 0}
          aria-label={NUTRITION_COPY.previousDay}
        >
          <IconChevronLeft size={20} aria-hidden="true" />
        </button>
        <h2 className="portion-tracker-title" id="portion-tracker-title">
          {date === today ? `${NUTRITION_COPY.today}, ${formatDateOnly(date)}` : formatDateOnly(date)}
        </h2>
        <button
          type="button"
          className="portion-tracker-arrow"
          onClick={() => onSelectDate(days[index + 1].date)}
          disabled={index >= days.length - 1}
          aria-label={NUTRITION_COPY.nextDay}
        >
          <IconChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="portion-tracker-days" role="group" aria-label={NUTRITION_COPY.dayTitle}>
        {days.map((candidate) => (
          <button
            key={candidate.date}
            type="button"
            className={'portion-tracker-day' + (candidate.date === date ? ' portion-tracker-day-selected' : '')}
            aria-pressed={candidate.date === date}
            aria-label={formatDateOnly(candidate.date)}
            onClick={() => onSelectDate(candidate.date)}
          >
            {weekdayOf(candidate.date)}
            {candidate.logged && <span className="portion-tracker-day-dot" aria-hidden="true" />}
          </button>
        ))}
      </div>

      {!hasPlan ? (
        <p className="portion-tracker-note">{NUTRITION_COPY.trackerNoPlan}</p>
      ) : (
        <ul className="portion-tracker-groups">
          {PORTION_GROUPS.filter((group) => day.planned[group] > 0).map((group) => {
            const planned = day.planned[group];
            const eaten = day.eaten[group];
            const groupLabel = FOOD_GROUP_LABELS[group];
            const totalLabel = describePortion(group, planned);
            const half = hasHalfMark(eaten);
            return (
              <li key={group} className="portion-tracker-row">
                <button
                  type="button"
                  className="portion-tracker-total"
                  onClick={() => onOpenSwaps(group)}
                  aria-label={NUTRITION_COPY.openSwaps(totalLabel)}
                >
                  {totalLabel}
                </button>
                <div className="portion-tracker-circles">
                  {circlesFor(planned, eaten).map((circle, circleIndex) => (
                    <button
                      key={circleIndex}
                      type="button"
                      className={[
                        'portion-tracker-circle',
                        circle.size < 1 ? 'portion-tracker-circle-small' : '',
                        circle.filled >= circle.size ? 'portion-tracker-circle-full' : circle.filled > 0 ? 'portion-tracker-circle-half' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      disabled={!canEdit}
                      aria-label={NUTRITION_COPY.circleLabel(groupLabel, circleIndex, circle.filled > 0)}
                      onClick={() => set(group, tapCircle(circle, planned, eaten))}
                    >
                      <span className="portion-tracker-circle-mark" aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={'portion-tracker-half' + (half ? ' portion-tracker-half-on' : '')}
                  disabled={!canEdit || (!half && eaten >= planned)}
                  aria-pressed={half}
                  aria-label={half ? NUTRITION_COPY.halfRemove(groupLabel.toLowerCase()) : NUTRITION_COPY.halfAdd(groupLabel.toLowerCase())}
                  onClick={() => set(group, toggleHalf(planned, eaten))}
                >
                  ½
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {vegetablesFree &&
        (hasVegetableSwaps ? (
          <button type="button" className="portion-tracker-vegetables portion-tracker-vegetables-button" onClick={() => onOpenSwaps('vegetable')}>
            {VEGETABLES_FREE_LABEL}
          </button>
        ) : (
          <p className="portion-tracker-vegetables">{VEGETABLES_FREE_LABEL}</p>
        ))}

      <p className="portion-tracker-note" role="status">
        {offline
          ? NUTRITION_COPY.trackerOffline
          : sync === 'pending'
            ? NUTRITION_COPY.trackerSavedLocally
            : sync === 'saving'
              ? NUTRITION_COPY.trackerSaving
              : !day.editable && hasPlan
                ? NUTRITION_COPY.trackerReadOnly
                : hasPlan
                  ? NUTRITION_COPY.trackerHint
                  : ''}
      </p>
    </section>
  );
}
