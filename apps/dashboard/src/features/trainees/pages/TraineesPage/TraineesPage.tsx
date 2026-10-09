import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTrainees } from '../../../../services/coach/coachService';
import { formatTimeAgo, matchesFilter, matchesSearch, sharedCopy, sortByUrgency, statusFilters, useCopy, useLanguage, useLoad, useServerNow } from '@sistem/shared';
import type { TraineeFilter } from '@sistem/shared';
import { traineePath } from '../../../../app/config/routes';
import { Button } from '../../../../components/common/Button/Button';
import { TraineeStatusBadges, PlanWindow } from '../../components/TraineeStatusBadges/TraineeStatusBadges';
import './TraineesPage.css';
import { traineesCopy } from '../../copy';

export function TraineesPage() {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const { data, error, isLoading, reload } = useLoad(listTrainees, shared.coach.loadTraineesError);
  const nowMs = useServerNow(data?.serverTime);
  const [filter, setFilter] = useState<TraineeFilter>('all');
  const [search, setSearch] = useState('');

  const trainees = useMemo(() => sortByUrgency(data?.items ?? []), [data]);
  const countFor = (id: TraineeFilter) => trainees.filter((trainee) => matchesFilter(trainee, id)).length;

  const visible = trainees.filter((trainee) => matchesFilter(trainee, filter) && matchesSearch(trainee, search));

  return (
    <div className="trainees-page">
      <h1 className="trainees-title">{shared.coach.traineesTitle}</h1>

      <div className="trainees-toolbar">
        <input
          className="trainees-search"
          type="search"
          placeholder={shared.coach.searchPlaceholder}
          aria-label={shared.coach.searchLabel}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          className="needs-plan-filter"
          type="button"
          aria-pressed={filter === 'needs_next_week'}
          onClick={() => setFilter(filter === 'needs_next_week' ? 'all' : 'needs_next_week')}
        >
          {shared.traineeStatus.needsNextWeek}
          <span className="needs-plan-count">{countFor('needs_next_week')}</span>
        </button>
      </div>

      <div className="trainees-filters" role="group" aria-label={shared.coach.filterLabel}>
        {statusFilters(language).map(({ id, label }) => (
          <button
            key={id}
            className="trainees-filter"
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label} <span className="trainees-filter-count">{countFor(id)}</span>
          </button>
        ))}
      </div>

      {isLoading && !data && <p className="trainees-message">{shared.common.loading}</p>}
      {error && (
        <p className="trainees-message" role="alert">
          {error} <Button size="sm" onClick={reload}>{shared.common.retry}</Button>
        </p>
      )}
      {data && visible.length === 0 && (
        <p className="trainees-message">{trainees.length === 0 ? shared.coach.noTrainees : shared.coach.noMatch}</p>
      )}

      {visible.length > 0 && (
        <div className="trainees-table-scroll">
          <table className="trainees-table">
            <thead>
              <tr>
                <th scope="col">{copy.name}</th>
                <th scope="col">{copy.email}</th>
                <th scope="col">{copy.status}</th>
                <th scope="col">{copy.window48h}</th>
                <th scope="col">{shared.coach.lastActivity}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((trainee) => (
                <tr key={trainee.id}>
                  <td>
                    <Link className="trainees-name" to={traineePath(trainee.id)}>
                      {trainee.name}
                    </Link>
                  </td>
                  <td>{trainee.email}</td>
                  <td>
                    <TraineeStatusBadges trainee={trainee} />
                  </td>
                  <td>
                    <PlanWindow planDueAt={trainee.planDueAt} nowMs={nowMs} />
                  </td>
                  <td>{trainee.lastActivityAt ? formatTimeAgo(trainee.lastActivityAt, nowMs, language) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
