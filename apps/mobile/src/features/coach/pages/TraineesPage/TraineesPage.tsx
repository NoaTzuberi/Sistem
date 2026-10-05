import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  NEEDS_NEXT_WEEK_LABEL,
  STATUS_FILTERS,
  formatTimeAgo,
  matchesFilter,
  matchesSearch,
  sortByUrgency,
  useLoad,
  useServerNow,
} from '@sistem/shared';
import type { TraineeFilter } from '@sistem/shared';
import { IconChevronRight } from '@tabler/icons-react';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { listTrainees } from '../../../../services/coach/coachService';
import { coachTraineePath } from '../../../../app/config/routes';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { PlanWindow, TraineeStatusBadges } from '../../components/TraineeStatusBadges/TraineeStatusBadges';
import './TraineesPage.css';

// Coach mode Trainees list (PRD §6). Statuses, filters and order are the dashboard's
// (@sistem/shared); the 48h countdown runs on the server's clock.
export function TraineesPage() {
  const { data, error, isLoading, reload } = useLoad(listTrainees, "Couldn't load your trainees.");
  const nowMs = useServerNow(data?.serverTime);
  const [filter, setFilter] = useState<TraineeFilter>('all');
  const [search, setSearch] = useState('');

  const trainees = useMemo(() => sortByUrgency(data?.items ?? []), [data]);
  const countFor = (id: TraineeFilter) => trainees.filter((trainee) => matchesFilter(trainee, id)).length;
  const visible = trainees.filter((trainee) => matchesFilter(trainee, filter) && matchesSearch(trainee, search));

  return (
    <AppShell>
      <div className="coach-trainees">
        <h1 className="coach-trainees-title">Trainees</h1>

        <input
          className="coach-trainees-search"
          type="search"
          enterKeyHint="search"
          placeholder="Search name or email"
          aria-label="Search trainees"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="coach-trainees-filters" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              className="coach-trainees-filter"
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label} <span className="coach-trainees-filter-count">{countFor(id)}</span>
            </button>
          ))}
        </div>

        <button
          className="coach-trainees-needs-plan"
          type="button"
          aria-pressed={filter === 'needs_next_week'}
          onClick={() => setFilter(filter === 'needs_next_week' ? 'all' : 'needs_next_week')}
        >
          {NEEDS_NEXT_WEEK_LABEL}
          <span className="coach-trainees-needs-plan-count">{countFor('needs_next_week')}</span>
        </button>

        {isLoading && !data && <StateMessage>Loading…</StateMessage>}
        {error && <StateMessage onRetry={reload}>{error}</StateMessage>}
        {data && visible.length === 0 && (
          <StateMessage>{trainees.length === 0 ? 'No trainees yet.' : 'No trainees match this filter.'}</StateMessage>
        )}

        <ul className="coach-trainees-list">
          {visible.map((trainee) => (
            <li key={trainee.id}>
              <Link className="coach-trainee-row" to={coachTraineePath(trainee.id)}>
                <span className="coach-trainee-row-main">
                  <span className="coach-trainee-row-name">{trainee.name}</span>
                  <TraineeStatusBadges trainee={trainee} />
                  {trainee.planDueAt && <PlanWindow planDueAt={trainee.planDueAt} nowMs={nowMs} />}
                  {trainee.lastActivityAt && (
                    <span className="coach-trainee-row-activity">
                      Last activity: {formatTimeAgo(trainee.lastActivityAt, nowMs)}
                    </span>
                  )}
                </span>
                <IconChevronRight className="coach-trainee-row-chevron" size={20} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
