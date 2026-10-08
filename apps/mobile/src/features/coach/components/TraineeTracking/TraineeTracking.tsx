import { useCallback, useState } from 'react';
import {
  FOOD_GROUP_LABELS,
  addDaysToDate,
  describeMarked,
  describeTrackingDay,
  formatDateOnly,
  formatWeekRange,
  mealPortionList,
  useLoad,
} from '@sistem/shared';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { getTraineeMealLogs } from '../../../../services/coach/coachService';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { PrivatePhoto } from '../../../../components/common/PrivatePhoto/PrivatePhoto';
import { NUTRITION_COPY } from '../../../nutrition/data/nutritionCopy';
import './TraineeTracking.css';

/**
 * Coach mode, read-only (PRD §5.6, 13a+): her portion tracking for one Sunday week —
 * marked vs planned per group, and her meal photos. Neutral: no scores, no calories.
 */
export function TraineeTracking({ traineeId }: { traineeId: string }) {
  // null = her current week (the server knows her zone).
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const load = useCallback(() => getTraineeMealLogs(traineeId, weekStart ?? undefined), [traineeId, weekStart]);
  const { data, error, isLoading, reload } = useLoad(load, NUTRITION_COPY.trackingLoadError);

  if (isLoading && !data) return <StateMessage>Loading…</StateMessage>;
  if (!data) return <StateMessage onRetry={reload}>{error}</StateMessage>;

  const isCurrentWeek = data.today >= data.weekStart && data.today <= addDaysToDate(data.weekStart, 6);
  const weekTotals = mealPortionList(data.totals.planned);

  return (
    <div className="coach-tracking">
      <div className="coach-tracking-nav">
        <button
          type="button"
          className="coach-tracking-arrow"
          onClick={() => setWeekStart(addDaysToDate(data.weekStart, -7))}
          aria-label={NUTRITION_COPY.trackingPreviousWeek}
        >
          <IconChevronLeft size={20} aria-hidden="true" />
        </button>
        <h2 className="coach-tracking-title">{NUTRITION_COPY.trackingWeek(formatWeekRange(data.weekStart))}</h2>
        <button
          type="button"
          className="coach-tracking-arrow"
          onClick={() => setWeekStart(addDaysToDate(data.weekStart, 7))}
          disabled={isCurrentWeek}
          aria-label={NUTRITION_COPY.trackingNextWeek}
        >
          <IconChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      {weekTotals.length > 0 && (
        <p className="coach-tracking-week">
          <strong>{NUTRITION_COPY.trackingWeekTotal}</strong>{' '}
          {weekTotals.map(({ group }) => `${FOOD_GROUP_LABELS[group]} ${describeMarked(data.totals.eaten[group], data.totals.planned[group])}`).join(' · ')}
        </p>
      )}

      <ul className="coach-tracking-days">
        {data.days.map((day) => {
          const view = describeTrackingDay(day, data.today);
          return (
            <li key={day.date} className="coach-tracking-day">
              <span className="coach-tracking-date">{formatDateOnly(day.date)}</span>
              {view.status === 'future' && <span className="coach-tracking-muted">{NUTRITION_COPY.trackingNotYet}</span>}
              {view.status === 'no_plan' && <span className="coach-tracking-muted">{NUTRITION_COPY.trackingNoPlan}</span>}
              {(view.status === 'marked' || view.status === 'not_marked') && (
                <span className={view.status === 'marked' ? 'coach-tracking-groups' : 'coach-tracking-muted'}>
                  {view.status === 'marked'
                    ? view.groups.map((group) => `${group.label} ${group.text}`).join(' · ')
                    : NUTRITION_COPY.trackingNotMarked}
                </span>
              )}
              {day.photos.length > 0 && (
                <div className="coach-tracking-photos">
                  {day.photos.map((photo) => (
                    <div key={photo.mealId} className="coach-tracking-photo">
                      <PrivatePhoto
                        photo={photo}
                        alt={NUTRITION_COPY.photoAlt(photo.mealName)}
                        openLabel={NUTRITION_COPY.photoOpen}
                        closeLabel={NUTRITION_COPY.photoClose}
                        onLinkExpired={reload}
                        thumbnail
                      />
                      <span className="coach-tracking-photo-name" dir="auto">
                        {photo.mealName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
