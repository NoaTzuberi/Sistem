import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fill, formatTimeAgo, matchesFilter, matchesSearch, sharedCopy, sortByUrgency, statusFilters, useCopy, useLanguage, useLoad, useServerNow } from '@sistem/shared';
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
  const shared = useCopy(sharedCopy);
  const copy = shared.coach;
  const language = useLanguage();
  const { data, error, isLoading, reload } = useLoad(listTrainees, copy.loadTraineesError);
  const nowMs = useServerNow(data?.serverTime);
  const [filter, setFilter] = useState<TraineeFilter>('all');
  const [search, setSearch] = useState('');

  const trainees = useMemo(() => sortByUrgency(data?.items ?? []), [data]);
  const countFor = (id: TraineeFilter) => trainees.filter((trainee) => matchesFilter(trainee, id)).length;
  const visible = trainees.filter((trainee) => matchesFilter(trainee, filter) && matchesSearch(trainee, search));

  return (
    <AppShell>
      <div className="coach-trainees">
        <h1 className="coach-trainees-title">{copy.traineesTitle}</h1>

        <input
          className="coach-trainees-search"
          type="search"
          enterKeyHint="search"
          placeholder={copy.searchPlaceholder}
          aria-label={copy.searchLabel}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="coach-trainees-filters" role="group" aria-label={copy.filterLabel}>
          {statusFilters(language).map(({ id, label }) => (
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
          {shared.traineeStatus.needsNextWeek}
          <span className="coach-trainees-needs-plan-count">{countFor('needs_next_week')}</span>
        </button>

        {isLoading && !data && <StateMessage>{shared.common.loading}</StateMessage>}
        {error && <StateMessage onRetry={reload}>{error}</StateMessage>}
        {data && visible.length === 0 && (
          <StateMessage>{trainees.length === 0 ? copy.noTrainees : copy.noMatch}</StateMessage>
        )}

        <ul className="coach-trainees-list">
          {visible.map((trainee) => (
            <li key={trainee.id}>
              <Link className="coach-trainee-row" to={coachTraineePath(trainee.id)}>
                <span className="coach-trainee-row-main">
                  <span className="coach-trainee-row-name" dir="auto">
                    {trainee.name}
                  </span>
                  <TraineeStatusBadges trainee={trainee} />
                  {trainee.planDueAt && <PlanWindow planDueAt={trainee.planDueAt} nowMs={nowMs} />}
                  {trainee.lastActivityAt && (
                    <span className="coach-trainee-row-activity">
                      {fill(copy.lastActivityAt, { time: formatTimeAgo(trainee.lastActivityAt, nowMs, language) })}
                    </span>
                  )}
                </span>
                <IconChevronRight className="flip-rtl coach-trainee-row-chevron" size={20} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
