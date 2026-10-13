import { sharedCopy, useCopy } from '@sistem/shared';
import type { AnswerSectionView, AnswerValue } from '../../data/questionnaireProfile';
import { WeightGoalBar } from '../WeightGoalBar/WeightGoalBar';
import './AnswerSection.css';

interface AnswerSectionProps {
  section: AnswerSectionView;
  /** Also list the rows she left empty. */
  showEmpty: boolean;
}

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
  if (value.kind === 'weightGoal') return <WeightGoalBar goal={value.goal} />;
  return <span dir="auto">{value.text}</span>;
}

/**
 * One questionnaire section as a white card: a plain title and a definition list — the label
 * in a quiet column, the answer next to it. Rows she left empty are hidden until asked for; a
 * section with nothing to show is not drawn at all.
 */
export function AnswerSection({ section, showEmpty }: AnswerSectionProps) {
  const shared = useCopy(sharedCopy);
  const rows = showEmpty ? section.rows : section.rows.filter((row) => row.value !== null);
  if (rows.length === 0) return null;

  return (
    <section className="answer-section">
      <h2 className="answer-section-title">{section.title}</h2>
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
