import { sharedCopy, useCopy } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import type { IconName } from '../../../../components/common/Icon/iconPaths';
import type { AnswerSectionView, AnswerValue } from '../../data/questionnaireProfile';
import './AnswerSection.css';

interface AnswerSectionProps {
  section: AnswerSectionView;
  /** Also list the rows she left empty. */
  showEmpty: boolean;
}

/** Each section's icon; its color identity is the `answer-section-<id>` class (AnswerSection.css). */
const SECTION_ICONS: Record<AnswerSectionView['id'], IconName> = {
  nutrition: 'foods',
  training: 'dumbbell',
  exercises: 'heart',
  personal: 'person',
};

function renderValue(value: AnswerValue) {
  if (value.kind === 'pills') {
    return (
      <ul className="answer-pills">
        {value.items.map((item) => (
          <li key={item} className="answer-pill" dir="auto">
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return <span dir="auto">{value.text}</span>;
}

/**
 * One questionnaire section as a white card in its own color identity (icon chip, pills): a
 * plain title and a definition list — the label
 * in a quiet column, the answer next to it. Rows she left empty are hidden until asked for; a
 * section with nothing to show is not drawn at all.
 */
export function AnswerSection({ section, showEmpty }: AnswerSectionProps) {
  const shared = useCopy(sharedCopy);
  const rows = showEmpty ? section.rows : section.rows.filter((row) => row.value !== null);
  if (rows.length === 0) return null;

  return (
    <section className={`answer-section answer-section-${section.id}`}>
      <h2 className="answer-section-title">
        <span className="answer-section-icon" aria-hidden="true">
          <Icon name={SECTION_ICONS[section.id]} size="sm" />
        </span>
        {section.title}
      </h2>
      <dl className="answer-list">
        {rows.map((row) => (
          <div key={row.id} className="answer-row">
            <dt>{row.label}</dt>
            {row.value ? <dd>{renderValue(row.value)}</dd> : <dd className="answer-empty">{shared.common.notAnswered}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
