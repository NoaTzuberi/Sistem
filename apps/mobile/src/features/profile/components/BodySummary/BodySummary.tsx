import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { BodyMetricList, UnitPreferences } from '@sistem/types';
import { IconChevronRight } from '@tabler/icons-react';
import { fill, formatChartDate, formatLength, formatSignedChange, formatWeight, latestMeasurements, measurementLabel, photoDays, rangeChange, useCopy, useLanguage, weighIns, weightPoints } from '@sistem/shared';
import { ROUTES } from '../../../../app/config/routes';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { Sparkline } from '../../../bodyTracking/components/Sparkline/Sparkline';
import { bodyCopy } from '../../../bodyTracking/copy';
import { profileCopy } from '../../copy';
import './BodySummary.css';

// How many measurements / weigh-ins the cards show before "+N more" / the sparkline.
const MEASUREMENTS_SHOWN = 3;
const SPARKLINE_POINTS = 12;

interface BodySummaryProps {
  list: BodyMetricList | undefined;
  error: string | undefined;
  units: UnitPreferences;
  onRetry: () => void;
}

function SummaryCard({ to, title, children }: { to: string; title: string; children: ReactNode }) {
  return (
    <Link to={to} className="body-summary-card">
      <span className="body-summary-card-content">
        <span className="body-summary-card-title">{title}</span>
        {children}
      </span>
      <IconChevronRight className="flip-rtl" size={20} aria-hidden="true" />
    </Link>
  );
}

/** The Body section of Profile: latest weight + trend, latest measurements, newest photos. */
export function BodySummary({ list, error, units, onRetry }: BodySummaryProps) {
  const language = useLanguage();
  const copy = useCopy(profileCopy);
  const bodyText = useCopy(bodyCopy);
  if (!list) return error ? <StateMessage onRetry={onRetry}>{error}</StateMessage> : <StateMessage>{bodyText.loading}</StateMessage>;

  const latestWeight = weighIns(list.items)[0];
  const trend = weightPoints(list.items, units.weight).slice(-SPARKLINE_POINTS);
  const change = rangeChange(trend);
  const measurements = latestMeasurements(list.items, list.measurementIds);
  const newestPhotos = photoDays(list.items)[0];

  return (
    <div className="body-summary">
      <SummaryCard to={ROUTES.PROFILE_WEIGHT} title={copy.weightCard}>
        {latestWeight ? (
          <span className="body-summary-weight">
            <span className="body-summary-text">
              <span className="body-summary-value">{formatWeight(latestWeight.weight, units.weight, language)}</span>
              <span className="body-summary-meta">
                {change !== null ? formatSignedChange(change, units.weight, language) : fill(copy.lastLogged, { date: formatChartDate(latestWeight.date, language) })}
              </span>
            </span>
            <Sparkline points={trend} />
          </span>
        ) : (
          <span className="body-summary-meta">{copy.noEntries}</span>
        )}
      </SummaryCard>

      <SummaryCard to={ROUTES.PROFILE_MEASUREMENTS} title={copy.measurementsCard}>
        {measurements.length > 0 ? (
          <span className="body-summary-text">
            <span className="body-summary-line">
              {measurements
                .slice(0, MEASUREMENTS_SHOWN)
                .map((item) => `${measurementLabel(item.id, language)} ${formatLength(item.cm, units.length, language)}`)
                .join(' · ')}
              {measurements.length > MEASUREMENTS_SHOWN && ` · ${fill(copy.moreMeasurements, { count: measurements.length - MEASUREMENTS_SHOWN })}`}
            </span>
            <span className="body-summary-meta">
              {fill(copy.lastLogged, { date: formatChartDate(measurements.reduce((a, b) => (a.date > b.date ? a : b)).date, language) })}
            </span>
          </span>
        ) : (
          <span className="body-summary-meta">{copy.noEntries}</span>
        )}
      </SummaryCard>

      <SummaryCard to={ROUTES.PROFILE_PHOTOS} title={copy.photosCard}>
        {newestPhotos ? (
          <span className="body-summary-text">
            <span className="body-summary-photos" aria-hidden="true">
              {/* Decorative previews: the card itself is the link; the photos open on the next screen. */}
              {newestPhotos.photos.map((photo) => (
                <img key={photo.pose} className="body-summary-photo" src={photo.url} alt="" loading="lazy" />
              ))}
            </span>
            <span className="body-summary-meta">{fill(copy.lastLogged, { date: formatChartDate(newestPhotos.date, language) })}</span>
          </span>
        ) : (
          <span className="body-summary-meta">{copy.noEntries}</span>
        )}
      </SummaryCard>
    </div>
  );
}
