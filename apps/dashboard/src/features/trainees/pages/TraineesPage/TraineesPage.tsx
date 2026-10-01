import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTrainees } from '../../../../services/coach/coachService';
import { useLoad, useServerNow, formatTimeAgo, NEEDS_NEXT_WEEK_LABEL, STATUS_FILTERS, matchesFilter, matchesSearch, sortByUrgency } from '@sistem/shared';
import type { TraineeFilter } from '@sistem/shared';
import { traineePath } from '../../../../app/config/routes';
import { Button } from '../../../../components/common/Button/Button';
import { TraineeStatusBadges, PlanWindow } from '../../components/TraineeStatusBadges/TraineeStatusBadges';
import './TraineesPage.css';

export function TraineesPage() {
  const { data, error, isLoading, reload } = useLoad(listTrainees, "Couldn't load your trainees.");
  const nowMs = useServerNow(data?.serverTime);
  const [filter, setFilter] = useState<TraineeFilter>('all');
  const [search, setSearch] = useState('');

  const trainees = useMemo(() => sortByUrgency(data?.items ?? []), [data]);
  const countFor = (id: TraineeFilter) => trainees.filter((trainee) => matchesFilter(trainee, id)).length;

  const visible = trainees.filter((trainee) => matchesFilter(trainee, filter) && matchesSearch(trainee, search));

  return (
    <div className="trainees-page">
      <h1 className="trainees-title">Trainees</h1>

      <div className="trainees-toolbar">
        <input
          className="trainees-search"
          type="search"
          placeholder="Search name or email"
          aria-label="Search trainees"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          className="needs-plan-filter"
          type="button"
          aria-pressed={filter === 'needs_next_week'}
          onClick={() => setFilter(filter === 'needs_next_week' ? 'all' : 'needs_next_week')}
        >
          {NEEDS_NEXT_WEEK_LABEL}
          <span className="needs-plan-count">{countFor('needs_next_week')}</span>
        </button>
      </div>

      <div className="trainees-filters" role="group" aria-label="Filter by status">
        {STATUS_FILTERS.map(({ id, label }) => (
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

      {isLoading && !data && <p className="trainees-message">Loading…</p>}
      {error && (
        <p className="trainees-message" role="alert">
          {error} <Button size="sm" onClick={reload}>Try again</Button>
        </p>
      )}
      {data && visible.length === 0 && (
        <p className="trainees-message">{trainees.length === 0 ? 'No trainees yet.' : 'No trainees match this filter.'}</p>
      )}

      {visible.length > 0 && (
        <div className="trainees-table-scroll">
          <table className="trainees-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Status</th>
                <th scope="col">48h window</th>
                <th scope="col">Last activity</th>
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
                  <td>{trainee.lastActivityAt ? formatTimeAgo(trainee.lastActivityAt, nowMs) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
