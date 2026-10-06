import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { BodyMetricList, UnitPreferences } from '@sistem/types';
import { IconChevronRight } from '@tabler/icons-react';
import {
  formatChartDate,
  formatLength,
  formatSignedChange,
  formatWeight,
  latestMeasurements,
  measurementLabel,
  photoDays,
  rangeChange,
  weighIns,
  weightPoints,
} from '@sistem/shared';
import { ROUTES } from '../../../../app/config/routes';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { Sparkline } from '../../../bodyTracking/components/Sparkline/Sparkline';
import { BODY_COPY } from '../../../bodyTracking/data/bodyCopy';
import { PROFILE_COPY } from '../../data/profileCopy';
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
      <IconChevronRight size={20} aria-hidden="true" />
    </Link>
  );
}

/** The Body section of Profile: latest weight + trend, latest measurements, newest photos. */
export function BodySummary({ list, error, units, onRetry }: BodySummaryProps) {
  if (!list) return error ? <StateMessage onRetry={onRetry}>{error}</StateMessage> : <StateMessage>{BODY_COPY.loading}</StateMessage>;

  const latestWeight = weighIns(list.items)[0];
  const trend = weightPoints(list.items, units.weight).slice(-SPARKLINE_POINTS);
  const change = rangeChange(trend);
  const measurements = latestMeasurements(list.items, list.measurementIds);
  const newestPhotos = photoDays(list.items)[0];

  return (
    <div className="body-summary">
      <SummaryCard to={ROUTES.PROFILE_WEIGHT} title={PROFILE_COPY.weightCard}>
        {latestWeight ? (
          <span className="body-summary-weight">
            <span className="body-summary-text">
              <span className="body-summary-value">{formatWeight(latestWeight.weight, units.weight)}</span>
              <span className="body-summary-meta">
                {change !== null ? formatSignedChange(change, units.weight) : PROFILE_COPY.lastLogged(formatChartDate(latestWeight.date))}
              </span>
            </span>
            <Sparkline points={trend} />
          </span>
        ) : (
          <span className="body-summary-meta">{PROFILE_COPY.noEntries}</span>
        )}
      </SummaryCard>

      <SummaryCard to={ROUTES.PROFILE_MEASUREMENTS} title={PROFILE_COPY.measurementsCard}>
        {measurements.length > 0 ? (
          <span className="body-summary-text">
            <span className="body-summary-line">
              {measurements
                .slice(0, MEASUREMENTS_SHOWN)
                .map((item) => `${measurementLabel(item.id)} ${formatLength(item.cm, units.length)}`)
                .join(' · ')}
              {measurements.length > MEASUREMENTS_SHOWN && ` · ${PROFILE_COPY.moreMeasurements(measurements.length - MEASUREMENTS_SHOWN)}`}
            </span>
            <span className="body-summary-meta">
              {PROFILE_COPY.lastLogged(formatChartDate(measurements.reduce((a, b) => (a.date > b.date ? a : b)).date))}
            </span>
          </span>
        ) : (
          <span className="body-summary-meta">{PROFILE_COPY.noEntries}</span>
        )}
      </SummaryCard>

      <SummaryCard to={ROUTES.PROFILE_PHOTOS} title={PROFILE_COPY.photosCard}>
        {newestPhotos ? (
          <span className="body-summary-text">
            <span className="body-summary-photos" aria-hidden="true">
              {/* Decorative previews: the card itself is the link; the photos open on the next screen. */}
              {newestPhotos.photos.map((photo) => (
                <img key={photo.pose} className="body-summary-photo" src={photo.url} alt="" loading="lazy" />
              ))}
            </span>
            <span className="body-summary-meta">{PROFILE_COPY.lastLogged(formatChartDate(newestPhotos.date))}</span>
          </span>
        ) : (
          <span className="body-summary-meta">{PROFILE_COPY.noEntries}</span>
        )}
      </SummaryCard>
    </div>
  );
}
