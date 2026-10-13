import { formatPlural, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { traineesCopy } from '../../copy';
import './MissingFieldsCard.css';

interface MissingFieldsCardProps {
  /** Labels of the fields she left empty. */
  fields: string[];
  /** The empty rows are shown in their sections right now. */
  isShowing: boolean;
  onToggle: () => void;
}

/** One quiet line instead of a wall of "—": how many fields are empty, which, and a way to see them. */
export function MissingFieldsCard({ fields, isShowing, onToggle }: MissingFieldsCardProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  if (fields.length === 0) return null;
  return (
    <section className="missing-card">
      <p className="missing-text">
        <span className="missing-count">{formatPlural(language, copy.missingFields, fields.length)}</span>
        {' · '}
        {fields.join(shared.common.listSeparator)}
      </p>
      <button className="missing-toggle" type="button" aria-pressed={isShowing} onClick={onToggle}>
        {isShowing ? copy.hideEmptyFields : copy.showEmptyFields}
      </button>
    </section>
  );
}
