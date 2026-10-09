import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { photoForPose, PROGRESS_PHOTO_POSES, useCopy } from '@sistem/shared';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Button } from '../../../../components/common/Button/Button';
import { Input } from '../../../../components/common/Input/Input';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { ROUTES } from '../../../../app/config/routes';
import { ProgressPhotoSlot } from '../../../bodyTracking/components/ProgressPhotoSlot/ProgressPhotoSlot';
import { bodyCopy } from '../../../bodyTracking/copy';
import { SubPageHeader } from '../../components/SubPageHeader/SubPageHeader';
import { useGoBack } from '../../hooks/useGoBack';
import { useMyBodyMetrics, useMyUnits } from '../../hooks/useMyBody';
import './ProgressPhotosDayPage.css';

/**
 * Add or change one day's progress photos (full screen): a date (today by default),
 * then front / side / back — each uploads as soon as it is picked.
 */
export function ProgressPhotosDayPage() {
  const copy = useCopy(bodyCopy);
  const [params] = useSearchParams();
  const { list, error, isLoading, reload, applyDay } = useMyBodyMetrics();
  const { today } = useMyUnits();
  const goBack = useGoBack(ROUTES.PROFILE_PHOTOS);
  const [date, setDate] = useState(params.get('date') ?? today);
  const day = list?.items.find((item) => item.date === date);
  const hasPhotos = (day?.photos.length ?? 0) > 0;

  return (
    <AppShell hideTabBar>
      <div className="progress-photos-day-page">
        <SubPageHeader title={hasPhotos ? copy.editPhotos : copy.addPhotos} fallbackPath={ROUTES.PROFILE_PHOTOS} />

        {isLoading && !list && <StateMessage>{copy.loading}</StateMessage>}
        {error && !list && <StateMessage onRetry={reload}>{error}</StateMessage>}

        {list && (
          <>
            <Input
              label={copy.date}
              type="date"
              max={today}
              value={date}
              onChange={(event) => event.target.value && setDate(event.target.value)}
            />
            <p className="progress-photos-day-page-hint">{copy.photosDayHint}</p>
            <div>
              {PROGRESS_PHOTO_POSES.map((pose) => (
                <ProgressPhotoSlot
                  key={`${date}-${pose}`}
                  date={date}
                  pose={pose}
                  photo={photoForPose(day, pose)}
                  onDayChange={(metric) => applyDay(date, metric)}
                  onLinkExpired={reload}
                />
              ))}
            </div>
            <p className="progress-photos-day-page-hint">{copy.privacy}</p>
            <Button onClick={goBack}>{copy.close}</Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
