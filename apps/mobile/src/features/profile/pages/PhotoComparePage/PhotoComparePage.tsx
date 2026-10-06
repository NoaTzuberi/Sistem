import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { ROUTES } from '../../../../app/config/routes';
import { PhotoCompare } from '../../../bodyTracking/components/PhotoCompare/PhotoCompare';
import { BODY_COPY } from '../../../bodyTracking/data/bodyCopy';
import { SubPageHeader } from '../../components/SubPageHeader/SubPageHeader';
import { useMyBodyMetrics, useMyUnits } from '../../hooks/useMyBody';
import './PhotoComparePage.css';

// Two days of one pose side by side (owner decision: no slider for now — backlog).
export function PhotoComparePage() {
  const { list, error, isLoading, reload } = useMyBodyMetrics();
  const { units } = useMyUnits();

  return (
    <AppShell>
      <div className="photo-compare-page">
        <SubPageHeader title={BODY_COPY.compareTitle} fallbackPath={ROUTES.PROFILE_PHOTOS} />
        {isLoading && !list && <StateMessage>{BODY_COPY.loading}</StateMessage>}
        {error && !list && <StateMessage onRetry={reload}>{error}</StateMessage>}
        {list && <PhotoCompare metrics={list.items} weightUnit={units.weight} onLinkExpired={reload} />}
      </div>
    </AppShell>
  );
}
