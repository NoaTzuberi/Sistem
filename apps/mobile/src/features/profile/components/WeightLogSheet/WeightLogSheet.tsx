import { useState } from 'react';
import type { FormEvent } from 'react';
import type { BodyMetric, WeightUnit } from '@sistem/types';
import { extractErrorMessage } from '@sistem/api-client';
import { fill, formatDateOnly, parseDecimalInput, toDisplayWeight, toKg, useCopy, useLanguage } from '@sistem/shared';
import { Button } from '../../../../components/common/Button/Button';
import { Input } from '../../../../components/common/Input/Input';
import { Modal } from '../../../../components/common/Modal/Modal';
import { saveBodyMetric } from '../../../../services/bodyMetrics/bodyMetricsService';
import { celebrate } from '../../../achievements/celebration';
import { bodyCopy } from '../../../bodyTracking/copy';
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
  const language = useLanguage();
  const copy = useCopy(bodyCopy);
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
      const saved = await saveBodyMetric(date, { weight: weightKg });
      onSaved(date, saved.metric);
      celebrate(saved.achievementsUnlocked);
      onClose();
    } catch (caught) {
      setError(extractErrorMessage(caught, weightKg === null ? copy.deleteError : copy.saveError));
      setIsSaving(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseDecimalInput(value);
    if (parsed === null || !date) {
      setError(copy.weightInvalid);
      return;
    }
    void save(toKg(parsed, unit));
  }

  return (
    <Modal isOpen onClose={onClose} variant="flat" title={isEdit ? copy.editWeight : copy.logWeight}>
      <form className="weight-log-sheet" onSubmit={handleSubmit} noValidate>
        {isEdit ? (
          <p className="weight-log-sheet-date">{formatDateOnly(date, language)}</p>
        ) : (
          <Input label={copy.date} type="date" max={today} value={date} onChange={(event) => setDate(event.target.value)} />
        )}
        <Input
          label={fill(copy.weightField, { unit })}
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
          {copy.save}
        </Button>
        {isEdit &&
          (confirmDelete ? (
            <div className="weight-log-sheet-confirm">
              <span>{copy.deleteWeightTitle}</span>
              <Button type="button" variant="danger" disabled={isSaving} onClick={() => void save(null)}>
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
    </Modal>
  );
}
