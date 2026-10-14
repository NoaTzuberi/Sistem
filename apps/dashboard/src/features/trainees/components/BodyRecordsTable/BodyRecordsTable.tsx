import { useState } from 'react';
import type { BodyMetric } from '@sistem/types';
import { fill, formatDateShort, formatNumber, measurementLabel, poseLabel, useCopy, useLanguage } from '@sistem/shared';
import { measureColorClass, previousWeight, signedNumber } from '../../data/bodySummary';
import { TabCard } from '../TabCard/TabCard';
import { traineesCopy } from '../../copy';
import './BodyRecordsTable.css';

interface BodyRecordsTableProps {
  /** Newest first. */
  metrics: BodyMetric[];
  measurementIds: string[];
}

/** How many of the newest days show before "Show all". */
const LATEST_ROWS = 5;

/** Every body day as a row: date, weight (with its change), each measurement and a photo — kg / cm. */
export function BodyRecordsTable({ metrics, measurementIds }: BodyRecordsTableProps) {
  const language = useLanguage();
  const copy = useCopy(traineesCopy);
  const [showAll, setShowAll] = useState(false);
  const hasMore = metrics.length > LATEST_ROWS;
  const rows = showAll ? metrics : metrics.slice(0, LATEST_ROWS);

  return (
    <TabCard
      className="body-records"
      title={copy.entries}
      subtitle={hasMore && !showAll ? fill(copy.body.latestCount, { count: LATEST_ROWS }) : copy.everyEntry}
      actions={
        hasMore && (
          <button type="button" className="body-records-toggle" aria-expanded={showAll} onClick={() => setShowAll((shown) => !shown)}>
            {showAll ? copy.body.showFewer : copy.body.showAll}
          </button>
        )
      }
    >
      {/* Scrolls inside the card on a phone; the page never does. */}
      <div className="body-records-scroll" tabIndex={0} role="region" aria-label={copy.everyEntry}>
        <table className="body-records-table">
          <thead>
            <tr>
              <th scope="col">{copy.date}</th>
              <th scope="col">{copy.weightKg}</th>
              {measurementIds.map((id) => (
                <th key={id} scope="col" className={measureColorClass(id)}>
                  <span className="body-records-dot" aria-hidden="true" />
                  {fill(copy.cmSuffix, { label: measurementLabel(id, language) })}
                </th>
              ))}
              <th scope="col">{copy.photo}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((metric, index) => {
              const before = metric.weight === undefined ? null : previousWeight(metrics, index);
              const photo = metric.photos[0];
              return (
                <tr key={metric.id}>
                  <td>{formatDateShort(metric.date, language)}</td>
                  <td>
                    {metric.weight === undefined ? (
                      <span className="body-records-none">—</span>
                    ) : (
                      <>
                        <b>{formatNumber(metric.weight, language)}</b>
                        {before !== null && metric.weight !== before && (
                          <span className="body-records-change"> {signedNumber(metric.weight - before, language)}</span>
                        )}
                      </>
                    )}
                  </td>
                  {measurementIds.map((id) => (
                    <td key={id}>
                      {metric.measurements[id] === undefined ? <span className="body-records-none">—</span> : formatNumber(metric.measurements[id], language)}
                    </td>
                  ))}
                  <td>
                    {photo ? (
                      <a className="body-records-photo" href={photo.url} target="_blank" rel="noreferrer">
                        <img
                          src={photo.url}
                          alt={fill(copy.photoAlt, { pose: poseLabel(photo.pose, language), date: formatDateShort(metric.date, language) })}
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <span className="body-records-none">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TabCard>
  );
}
