import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BodyMetric } from '@sistem/types';
import { extractErrorMessage } from '@sistem/api-client';
import { fill, formatLength, latestMeasurements, measurementLabel, parseDecimalInput, toCm, toDisplayLength, useCopy, useLanguage } from '@sistem/shared';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Button } from '../../../../components/common/Button/Button';
import { Input } from '../../../../components/common/Input/Input';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { ROUTES } from '../../../../app/config/routes';
import { saveBodyMetric } from '../../../../services/bodyMetrics/bodyMetricsService';
import { celebrate } from '../../../achievements/celebration';
import { bodyCopy } from '../../../bodyTracking/copy';
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
  const language = useLanguage();
  const copy = useCopy(bodyCopy);
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
      setFormError(extractErrorMessage(caught, copy.saveError));
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
        setFormError(copy.measurementsInvalid);
        return;
      }
      measurements[id] = toCm(parsed, units.length);
    }
    if (!date || Object.keys(measurements).length === 0) {
      setFormError(copy.measurementsInvalid);
      return;
    }
    void send(measurements);
  }

  return (
    <AppShell hideTabBar>
      <div className="measurements-log-page">
        <SubPageHeader title={hasSaved ? copy.editMeasurements : copy.logMeasurements} fallbackPath={ROUTES.PROFILE_MEASUREMENTS} />

        {isLoading && !list && <StateMessage>{copy.loading}</StateMessage>}
        {error && !list && <StateMessage onRetry={reload}>{error}</StateMessage>}

        {list && (
          <form className="measurements-log-page-form" onSubmit={handleSubmit} noValidate>
            <Input label={copy.date} type="date" max={today} value={date} onChange={(event) => setDate(event.target.value)} />
            {ids.map((id) => {
              const last = lastElsewhere.get(id);
              return (
                <Input
                  key={id}
                  label={fill(copy.measurementField, { label: measurementLabel(id, language), unit: units.length })}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  enterKeyHint="next"
                  value={values[id] ?? ''}
                  helperText={last !== undefined ? fill(copy.lastValue, { value: formatLength(last, units.length, language) }) : undefined}
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
              {copy.save}
            </Button>
            {hasSaved &&
              (confirmDelete ? (
                <div className="measurements-log-page-confirm">
                  <span>{copy.deleteMeasurementsTitle}</span>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={isSaving}
                    onClick={() => void send(Object.fromEntries(Object.keys(day!.measurements).map((id) => [id, null])))}
                  >
                    {copy.delete}
                  </Button>
                  <Button type="button" variant="ghost" disabled={isSaving} onClick={() => setConfirmDelete(false)}>
                    {copy.cancel}
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" disabled={isSaving} onClick={() => setConfirmDelete(true)}>
                  {copy.delete}
                </Button>
              ))}
          </form>
        )}
      </div>
    </AppShell>
  );
}
