import { useNavigate } from 'react-router-dom';
import { photoDays } from '@sistem/shared';
import { IconPlus } from '@tabler/icons-react';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Button } from '../../../../components/common/Button/Button';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { ROUTES, progressPhotosDayPath } from '../../../../app/config/routes';
import { ProgressPhotoGallery } from '../../../bodyTracking/components/ProgressPhotoGallery/ProgressPhotoGallery';
import { BODY_COPY } from '../../../bodyTracking/data/bodyCopy';
import { SubPageHeader } from '../../components/SubPageHeader/SubPageHeader';
import { useMyBodyMetrics } from '../../hooks/useMyBody';
import './ProgressPhotosPage.css';

// Progress photos (PRD §5.5): dated front / side / back, newest first; add, edit, compare.
export function ProgressPhotosPage() {
  const navigate = useNavigate();
  const { list, error, isLoading, reload } = useMyBodyMetrics();
  const canCompare = list !== undefined && photoDays(list.items).length >= 2;

  return (
    <AppShell>
      <div className="progress-photos-page">
        <SubPageHeader
          title={BODY_COPY.photosTitle}
          fallbackPath={ROUTES.PROFILE}
          action={
            <Button
              variant="secondary"
              icon={<IconPlus size={18} aria-hidden="true" />}
              aria-label={BODY_COPY.addPhotos}
              onClick={() => navigate(progressPhotosDayPath())}
            >
              {BODY_COPY.addShort}
            </Button>
          }
        />

        {isLoading && !list && <StateMessage>{BODY_COPY.loading}</StateMessage>}
        {error && !list && <StateMessage onRetry={reload}>{error}</StateMessage>}

        {list && (
          <>
            {canCompare && (
              <Button variant="secondary" onClick={() => navigate(ROUTES.PROFILE_PHOTOS_COMPARE)}>
                {BODY_COPY.compare}
              </Button>
            )}
            <ProgressPhotoGallery metrics={list.items} onLinkExpired={reload} onEditDay={(date) => navigate(progressPhotosDayPath(date))} />
            <p className="progress-photos-page-privacy">{BODY_COPY.privacy}</p>
          </>
        )}
      </div>
    </AppShell>
  );
}
