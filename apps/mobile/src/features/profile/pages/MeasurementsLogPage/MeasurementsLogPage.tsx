import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BodyMetric } from '@sistem/types';
import { extractErrorMessage } from '@sistem/api-client';
import { formatLength, latestMeasurements, measurementLabel, parseDecimalInput, toCm, toDisplayLength } from '@sistem/shared';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Button } from '../../../../components/common/Button/Button';
import { Input } from '../../../../components/common/Input/Input';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { ROUTES } from '../../../../app/config/routes';
import { saveBodyMetric } from '../../../../services/bodyMetrics/bodyMetricsService';
import { celebrate } from '../../../achievements/celebration';
import { BODY_COPY } from '../../../bodyTracking/data/bodyCopy';
import { SubPageHeader } from '../../components/SubPageHeader/SubPageHeader';
import { useGoBack } from '../../hooks/useGoBack';
import { useMyBodyMetrics, useMyUnits } from '../../hooks/useMyBody';
import './MeasurementsLogPage.css';

function valuesOf(day: BodyMetric | undefined, ids: string[], unit: 'cm' | 'in'): Record<string, string> {
  return Object.fromEntries(
    ids.map((id) => [id, day?.measurements[id] !== undefined ? String(toDisplayLength(day.measurements[id], unit)) : '']),
  );
}

/**
 * Log or change one day's measurements (full screen). The form always shows the chosen
 * day: picking a date that already has measurements opens them for editing (one day
 * per date). Empty fields are skipped; emptying a saved one clears it.
 */
export function MeasurementsLogPage() {
  const [params] = useSearchParams();
  const { list, error, isLoading, reload } = useMyBodyMetrics();
  const { units, today } = useMyUnits();
  const goBack = useGoBack(ROUTES.PROFILE_MEASUREMENTS);
  const [date, setDate] = useState(params.get('date') ?? today);
  const [values, setValues] = useState<Record<string, string>>({});
  const [filledFor, setFilledFor] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const ids = list?.measurementIds ?? [];
  const day = list?.items.find((item) => item.date === date);
  const hasSaved = Object.keys(day?.measurements ?? {}).length > 0;
  // Fill the fields from the chosen day once it is known (and again when the date changes).
  if (list && filledFor !== date) {
    setFilledFor(date);
    setValues(valuesOf(day, ids, units.length));
    setConfirmDelete(false);
  }
  const lastElsewhere = new Map(
    latestMeasurements(list?.items.filter((item) => item.date !== date) ?? [], ids).map((item) => [item.id, item.cm]),
  );

  async function send(measurements: Record<string, number | null>) {
    setFormError(null);
    setIsSaving(true);
    try {
      const saved = await saveBodyMetric(date, { measurements });
      celebrate(saved.achievementsUnlocked);
      goBack();
    } catch (caught) {
      setFormError(extractErrorMessage(caught, BODY_COPY.saveError));
      setIsSaving(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const measurements: Record<string, number | null> = {};
    for (const id of ids) {
      const text = values[id]?.trim() ?? '';
      if (text === '') {
        if (day?.measurements[id] !== undefined) measurements[id] = null;
        continue;
      }
      const parsed = parseDecimalInput(text);
      if (parsed === null) {
        setFormError(BODY_COPY.measurementsInvalid);
        return;
      }
      measurements[id] = toCm(parsed, units.length);
    }
    if (!date || Object.keys(measurements).length === 0) {
      setFormError(BODY_COPY.measurementsInvalid);
      return;
    }
    void send(measurements);
  }

  return (
    <AppShell hideTabBar>
      <div className="measurements-log-page">
        <SubPageHeader title={hasSaved ? BODY_COPY.editMeasurements : BODY_COPY.logMeasurements} fallbackPath={ROUTES.PROFILE_MEASUREMENTS} />

        {isLoading && !list && <StateMessage>{BODY_COPY.loading}</StateMessage>}
        {error && !list && <StateMessage onRetry={reload}>{error}</StateMessage>}

        {list && (
          <form className="measurements-log-page-form" onSubmit={handleSubmit} noValidate>
            <Input label={BODY_COPY.date} type="date" max={today} value={date} onChange={(event) => setDate(event.target.value)} />
            {ids.map((id) => {
              const last = lastElsewhere.get(id);
              return (
                <Input
                  key={id}
                  label={BODY_COPY.measurementField(measurementLabel(id), units.length)}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  enterKeyHint="next"
                  value={values[id] ?? ''}
                  helperText={last !== undefined ? BODY_COPY.lastValue(formatLength(last, units.length)) : undefined}
                  onChange={(event) => setValues((previous) => ({ ...previous, [id]: event.target.value }))}
                />
              );
            })}
            {formError && (
              <p className="measurements-log-page-error" role="alert">
                {formError}
              </p>
            )}
            <Button type="submit" loading={isSaving} disabled={isSaving}>
              {BODY_COPY.save}
            </Button>
            {hasSaved &&
              (confirmDelete ? (
                <div className="measurements-log-page-confirm">
                  <span>{BODY_COPY.deleteMeasurementsTitle}</span>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={isSaving}
                    onClick={() => void send(Object.fromEntries(Object.keys(day!.measurements).map((id) => [id, null])))}
                  >
                    {BODY_COPY.delete}
                  </Button>
                  <Button type="button" variant="ghost" disabled={isSaving} onClick={() => setConfirmDelete(false)}>
                    {BODY_COPY.cancel}
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" disabled={isSaving} onClick={() => setConfirmDelete(true)}>
                  {BODY_COPY.delete}
                </Button>
              ))}
          </form>
        )}
      </div>
    </AppShell>
  );
}
