import { useCallback, useState } from 'react';
import { addDaysToDate, describeMarked, describeTrackingDay, fill, formatDateOnly, formatWeekRange, PORTION_GROUPS, sharedCopy, useCopy, useLanguage, useLoad } from '@sistem/shared';
import { getTraineeMealLogs } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import { nutritionCopy } from '../../copy';
import './TrackingWeek.css';

/**
 * Her portion tracking (PRD §5.6, 13a+), one Sunday week, read-only: per day and group
 * "marked of planned", week totals, meal photos. Neutral — no scores, no calories.
 */
export function TrackingWeek({ traineeId }: { traineeId: string }) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const load = useCallback(() => getTraineeMealLogs(traineeId, weekStart ?? undefined), [traineeId, weekStart]);
  const { data, error, isLoading, reload } = useLoad(load, copy.trackingLoadError);

  if (isLoading && !data) return <p className="tracking-week-note">{shared.common.loading}</p>;
  if (!data) {
    return (
      <p role="alert">
        {error} <Button size="sm" onClick={reload}>{shared.common.retry}</Button>
      </p>
    );
  }

  const isCurrentWeek = data.today <= addDaysToDate(data.weekStart, 6);
  const groups = PORTION_GROUPS.filter((group) => data.days.some((day) => day.planned[group] > 0));

  return (
    <section className="tracking-week" aria-labelledby="tracking-week-title">
      <div className="tracking-week-head">
        <h2 className="tracking-week-title" id="tracking-week-title">
          {copy.trackingTitle} · {fill(copy.trackingWeek, { range: formatWeekRange(data.weekStart, language) })}
        </h2>
        <Button size="sm" onClick={() => setWeekStart(addDaysToDate(data.weekStart, -7))}>
          {copy.trackingPrevious}
        </Button>
        <Button size="sm" onClick={() => setWeekStart(addDaysToDate(data.weekStart, 7))} disabled={isCurrentWeek}>
          {copy.trackingNext}
        </Button>
      </div>

      <table className="tracking-week-table">
        <thead>
          <tr>
            <th scope="col">{copy.trackingDay}</th>
            {groups.map((group) => (
              <th key={group} scope="col">
                {shared.nutrition.groups[group]}
              </th>
            ))}
            <th scope="col">{copy.trackingPhotos}</th>
          </tr>
        </thead>
        <tbody>
          {data.days.map((day) => {
            const view = describeTrackingDay(day, data.today, language);
            const muted =
              view.status === 'future'
                ? copy.trackingNotYet
                : view.status === 'no_plan'
                  ? copy.trackingNoPlan
                  : view.status === 'not_marked'
                    ? copy.trackingNotMarked
                    : null;
            return (
              <tr key={day.date}>
                <th scope="row">{formatDateOnly(day.date, language)}</th>
                {muted ? (
                  <td colSpan={groups.length} className="tracking-week-muted">
                    {muted}
                  </td>
                ) : (
                  groups.map((group) => {
                    const planned = day.planned[group];
                    return (
                      <td key={group}>
                        {planned > 0 ? (
                          <>
                            {describeMarked(day.eaten[group], planned, language)}
                            {/* A neutral bar (token colors only), never a score. */}
                            <progress className="tracking-week-bar" value={Math.min(day.eaten[group], planned)} max={planned} aria-hidden="true" />
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    );
                  })
                )}
                <td>
                  <div className="tracking-week-photos">
                    {day.photos.map((photo) => (
                      // A short-lived signed link made for this coach only; a click opens it full size.
                      <a key={photo.mealId} className="tracking-week-photo" href={photo.url} target="_blank" rel="noreferrer" title={photo.mealName}>
                        <img src={photo.url} alt={`${photo.mealName} — ${formatDateOnly(day.date, language)}`} loading="lazy" />
                      </a>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">{copy.trackingWeekTotal}</th>
            {groups.map((group) => (
              <td key={group}>{describeMarked(data.totals.eaten[group], data.totals.planned[group], language)}</td>
            ))}
            <td />
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
