import { useState } from 'react';
import { useCopy, weightPoints } from '@sistem/shared';
import { IconPlus } from '@tabler/icons-react';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Button } from '../../../../components/common/Button/Button';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { ROUTES } from '../../../../app/config/routes';
import { TrendChart } from '../../../bodyTracking/components/TrendChart/TrendChart';
import { WeightHistory } from '../../../bodyTracking/components/WeightHistory/WeightHistory';
import { bodyCopy } from '../../../bodyTracking/copy';
import { SubPageHeader } from '../../components/SubPageHeader/SubPageHeader';
import { WeightLogSheet } from '../../components/WeightLogSheet/WeightLogSheet';
import type { WeightSheetTarget } from '../../components/WeightLogSheet/WeightLogSheet';
import { useMyBodyMetrics, useMyUnits } from '../../hooks/useMyBody';
import './WeightPage.css';

// Body weight over time (PRD §5.5): the chart, every weigh-in, log / edit / delete.
export function WeightPage() {
  const copy = useCopy(bodyCopy);
  const { list, error, isLoading, reload, applyDay } = useMyBodyMetrics();
  const { units, today } = useMyUnits();
  const [sheet, setSheet] = useState<WeightSheetTarget | null>(null);

  return (
    <AppShell>
      <div className="weight-page">
        <SubPageHeader
          title={copy.weightTitle}
          fallbackPath={ROUTES.PROFILE}
          action={
            <Button
              variant="secondary"
              icon={<IconPlus size={18} aria-hidden="true" />}
              aria-label={copy.logWeight}
              onClick={() => setSheet({ date: today })}
              disabled={!list}
            >
              {copy.logShort}
            </Button>
          }
        />

        {isLoading && !list && <StateMessage>{copy.loading}</StateMessage>}
        {error && !list && <StateMessage onRetry={reload}>{error}</StateMessage>}

        {list && (
          <>
            <TrendChart points={weightPoints(list.items, units.weight)} unit={units.weight} title={copy.weightTitle} today={today} />
            <WeightHistory metrics={list.items} unit={units.weight} onEdit={(metric) => setSheet({ date: metric.date, weight: metric.weight })} />
          </>
        )}

        {sheet && <WeightLogSheet target={sheet} today={today} unit={units.weight} onClose={() => setSheet(null)} onSaved={applyDay} />}
      </div>
    </AppShell>
  );
}
