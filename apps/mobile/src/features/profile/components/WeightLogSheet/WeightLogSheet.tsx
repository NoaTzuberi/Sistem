import { useState } from 'react';
import type { FormEvent } from 'react';
import type { BodyMetric, WeightUnit } from '@sistem/types';
import { extractErrorMessage } from '@sistem/api-client';
import { formatDateOnly, parseDecimalInput, toDisplayWeight, toKg } from '@sistem/shared';
import { Button } from '../../../../components/common/Button/Button';
import { Input } from '../../../../components/common/Input/Input';
import { Modal } from '../../../../components/common/Modal/Modal';
import { saveBodyMetric } from '../../../../services/bodyMetrics/bodyMetricsService';
import { BODY_COPY } from '../../../bodyTracking/data/bodyCopy';
import './WeightLogSheet.css';

export interface WeightSheetTarget {
  date: string;
  /** kg — set when editing an existing weigh-in (its date is then fixed). */
  weight?: number;
}

interface WeightLogSheetProps {
  target: WeightSheetTarget;
  today: string;
  unit: WeightUnit;
  onClose: () => void;
  /** The day as the server has it now (null: nothing left in it). */
  onSaved: (date: string, metric: BodyMetric | null) => void;
}

/**
 * Log a weight (today by default, or an earlier day) or change / delete one. One weight
 * per day: logging a day that has one replaces it. Typed in her unit, sent in kg.
 */
export function WeightLogSheet({ target, today, unit, onClose, onSaved }: WeightLogSheetProps) {
  const isEdit = target.weight !== undefined;
  const [date, setDate] = useState(target.date);
  const [value, setValue] = useState(isEdit ? String(toDisplayWeight(target.weight!, unit)) : '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save(weightKg: number | null) {
    setError(null);
    setIsSaving(true);
    try {
      onSaved(date, await saveBodyMetric(date, { weight: weightKg }));
      onClose();
    } catch (caught) {
      setError(extractErrorMessage(caught, weightKg === null ? BODY_COPY.deleteError : BODY_COPY.saveError));
      setIsSaving(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseDecimalInput(value);
    if (parsed === null || !date) {
      setError(BODY_COPY.weightInvalid);
      return;
    }
    void save(toKg(parsed, unit));
  }

  return (
    <Modal isOpen onClose={onClose} variant="flat" title={isEdit ? BODY_COPY.editWeight : BODY_COPY.logWeight}>
      <form className="weight-log-sheet" onSubmit={handleSubmit} noValidate>
        {isEdit ? (
          <p className="weight-log-sheet-date">{formatDateOnly(date)}</p>
        ) : (
          <Input label={BODY_COPY.date} type="date" max={today} value={date} onChange={(event) => setDate(event.target.value)} />
        )}
        <Input
          label={BODY_COPY.weightField(unit)}
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        {error && (
          <p className="weight-log-sheet-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" loading={isSaving} disabled={isSaving}>
          {BODY_COPY.save}
        </Button>
        {isEdit &&
          (confirmDelete ? (
            <div className="weight-log-sheet-confirm">
              <span>{BODY_COPY.deleteWeightTitle}</span>
              <Button type="button" variant="danger" disabled={isSaving} onClick={() => void save(null)}>
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
    </Modal>
  );
}
