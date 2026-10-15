import { useNavigate } from 'react-router-dom';
import { photoDays, useCopy } from '@sistem/shared';
import { IconPlus } from '@tabler/icons-react';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Button } from '../../../../components/common/Button/Button';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { ROUTES, progressPhotosDayPath } from '../../../../app/config/routes';
import { ProgressPhotoGallery } from '../../../bodyTracking/components/ProgressPhotoGallery/ProgressPhotoGallery';
import { bodyCopy } from '../../../bodyTracking/copy';
import { StartingPhotoCard } from '../../../bodyTracking/components/StartingPhotoCard/StartingPhotoCard';
import { SubPageHeader } from '../../components/SubPageHeader/SubPageHeader';
import { useMyBodyMetrics } from '../../hooks/useMyBody';
import { useMyUnits } from '../../hooks/useMyBody';
import './ProgressPhotosPage.css';

// Progress photos (PRD §5.5): dated front / side / back, newest first; add, edit, compare.
export function ProgressPhotosPage() {
  const copy = useCopy(bodyCopy);
  const navigate = useNavigate();
  const { list, error, isLoading, reload, applyDay } = useMyBodyMetrics();
  const { today } = useMyUnits();
  const startingMetric = list?.items.find((metric) => metric.startingPhoto);
  const canCompare = list !== undefined && photoDays(list.items).length >= 2;

  return (
    <AppShell>
      <div className="progress-photos-page">
        <SubPageHeader
          title={copy.photosTitle}
          fallbackPath={ROUTES.PROFILE}
          action={
            <Button
              variant="secondary"
              icon={<IconPlus size={18} aria-hidden="true" />}
              aria-label={copy.addPhotos}
              onClick={() => navigate(progressPhotosDayPath())}
            >
              {copy.addShort}
            </Button>
          }
        />

        {isLoading && !list && <StateMessage>{copy.loading}</StateMessage>}
        {error && !list && <StateMessage onRetry={reload}>{error}</StateMessage>}

        {list && (
          <>
            <StartingPhotoCard
              date={today}
              photoDate={startingMetric?.date}
              photo={startingMetric?.startingPhoto}
              onDayChange={(metric) => {
                applyDay(today, metric);
                reload();
              }}
              onLinkExpired={reload}
            />
            {canCompare && (
              <Button variant="secondary" onClick={() => navigate(ROUTES.PROFILE_PHOTOS_COMPARE)}>
                {copy.compare}
              </Button>
            )}
            <ProgressPhotoGallery metrics={list.items} onLinkExpired={reload} onEditDay={(date) => navigate(progressPhotosDayPath(date))} />
            <p className="progress-photos-page-privacy">{copy.privacy}</p>
          </>
        )}
      </div>
    </AppShell>
  );
}
