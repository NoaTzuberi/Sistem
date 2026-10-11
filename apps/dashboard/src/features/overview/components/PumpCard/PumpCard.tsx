import { useState } from 'react';
import type { CoachStats } from '@sistem/types';
import { fill, formatNumber, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { ROUTES, traineePath } from '../../../../app/config/routes';
import { Icon } from '../../../../components/common/Icon/Icon';
import { RoundButton } from '../../../../components/common/RoundButton/RoundButton';
import { WidgetCard } from '../../../../components/common/WidgetCard/WidgetCard';
import { overviewCopy } from '../../copy';
import './PumpCard.css';

interface PumpCardProps {
  pump: CoachStats['pump'];
  className?: string;
}

/**
 * The latest Daily Pump photos as a small tilted stack, and how many are new. The photos are
 * private: each `url` is a short-lived signed link the server made for this coach.
 */
export function PumpCard({ pump, className }: PumpCardProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(overviewCopy);
  // A link that expired (the page stayed open for an hour) just leaves the stack.
  const [failed, setFailed] = useState<readonly string[]>([]);
  const photos = pump.photos.filter((item) => !failed.includes(item.logId));
  const newest = pump.photos[0];

  return (
    <WidgetCard
      className={className}
      title={copy.pump.title}
      subtitle={copy.pump.subtitle}
      action={
        <RoundButton
          variant="outline"
          label={shared.coach.openPumpPhoto}
          // They are viewed where they live: the trainee's workout logs.
          to={newest ? traineePath(newest.traineeId, 'logs') : ROUTES.TRAINEES}
        >
          <Icon name="arrowOut" size="sm" flip />
        </RoundButton>
      }
    >
      {photos.length > 0 && (
        <div className="pump-stack">
          {photos.map((item) => (
            <img
              key={item.logId}
              className="pump-photo"
              src={item.photo.url}
              alt={fill(shared.coach.pumpPhotoAlt, { workout: item.workoutTitle })}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setFailed((current) => [...current, item.logId])}
            />
          ))}
        </div>
      )}
      <p className="pump-count">{formatNumber(pump.newCount, language)}</p>
      <p className="pump-caption">{copy.pump.newSince}</p>
    </WidgetCard>
  );
}
