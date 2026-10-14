import { useState } from 'react';
import type { BodyMetric } from '@sistem/types';
import { CHART_RANGES, chartRangeLabel, defaultChartRange, fill, formatPlural, pointsInRange, useCopy, useLanguage, weightPoints } from '@sistem/shared';
import type { ChartRange } from '@sistem/shared';
import { RangeSegmented } from '../../../stats/components/RangeSegmented/RangeSegmented';
import { BodyAreaChart } from '../BodyAreaChart/BodyAreaChart';
import { StripedEmpty } from '../StripedEmpty/StripedEmpty';
import { TabCard } from '../TabCard/TabCard';
import { traineesCopy } from '../../copy';
import './WeightTrendCard.css';

interface WeightTrendCardProps {
  metrics: BodyMetric[];
  /** Her today ('YYYY-MM-DD', her zone): the ranges end here. */
  today: string;
  intro: boolean;
}

/** Her weight over time: a pink area chart that fills the card, with the range control (1M … All). */
export function WeightTrendCard({ metrics, today, intro }: WeightTrendCardProps) {
  const language = useLanguage();
  const copy = useCopy(traineesCopy);
  const points = weightPoints(metrics, 'kg');
  const [range, setRange] = useState<ChartRange>(() => defaultChartRange(points, today));
  const visible = pointsInRange(points, range, today);

  return (
    <TabCard
      className="weight-trend-card"
      title={copy.weight}
      subtitle={formatPlural(language, copy.body.weighIns, points.length)}
      actions={
        points.length >= 2 && (
          <RangeSegmented
            label={copy.timeRange}
            size="compact"
            options={CHART_RANGES.map((id) => ({ id, label: chartRangeLabel(id, language) }))}
            value={range}
            onChange={setRange}
          />
        )
      }
    >
      {visible.length >= 2 ? (
        <BodyAreaChart points={visible} unit="kg" label={fill(copy.overTime, { title: copy.weight })} intro={intro} size="fill" />
      ) : (
        <StripedEmpty icon="trend" text={points.length < 2 ? copy.body.trendAfterSecond : copy.notEnoughTrend} />
      )}
    </TabCard>
  );
}
