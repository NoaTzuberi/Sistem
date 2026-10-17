import { useMemo, useState } from 'react';
import { fill, searchByText, useCopy, useLoad } from '@sistem/shared';
import { listTrainees } from '../../../../services/coach/coachService';
import { SideSheet } from '../../../../components/common/SideSheet/SideSheet';
import { StateLine } from '../../../../components/common/StateLine/StateLine';
import { Icon } from '../../../../components/common/Icon/Icon';
import { nutritionLibraryCopy } from '../../copy';
import './TraineePickerSheet.css';

interface TraineePickerSheetProps {
  isOpen: boolean;
  /** The template being used; null = only open a trainee's builder. */
  templateName: string | null;
  onClose: () => void;
  onPick: (traineeId: string) => void;
}

/** "For which trainee?" — her nutrition builder opens next (with the template, when there is one). */
export function TraineePickerSheet({ isOpen, templateName, onClose, onPick }: TraineePickerSheetProps) {
  const copy = useCopy(nutritionLibraryCopy);
  const { data, error, reload } = useLoad(listTrainees, copy.traineesLoadError);
  const [query, setQuery] = useState('');
  const trainees = useMemo(() => searchByText(data?.items ?? [], query, (trainee) => trainee.name), [data, query]);

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      title={copy.pickTraineeTitle}
      subtitle={templateName ? fill(copy.pickTraineeFrom, { name: templateName }) : copy.pickTraineeBuilder}
    >
      <label className="template-trainee-search">
        <Icon name="search" size="sm" />
        <span className="visually-hidden">{copy.pickTraineeSearch}</span>
        <input
          className="template-trainee-input"
          type="search"
          dir="auto"
          placeholder={copy.pickTraineeSearch}
          value={query}
          data-autofocus
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {!data && <StateLine error={error} onRetry={reload} />}
      {data && trainees.length === 0 && <p className="template-trainee-empty">{copy.pickTraineeEmpty}</p>}
      {data && trainees.length > 0 && (
        <ul className="template-trainee-list">
          {trainees.map((trainee) => (
            <li key={trainee.id}>
              <button className="template-trainee-item" type="button" onClick={() => onPick(trainee.id)}>
                <bdi className="template-trainee-name">{trainee.name}</bdi>
                <Icon name="chevron" size="sm" flip />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SideSheet>
  );
}
