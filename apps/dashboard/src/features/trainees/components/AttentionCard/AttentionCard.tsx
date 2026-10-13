import { useCopy } from '@sistem/shared';
import type { AttentionItem } from '../../data/questionnaireProfile';
import { traineesCopy } from '../../copy';
import './AttentionCard.css';

interface AttentionCardProps {
  items: AttentionItem[];
}

/**
 * "Before you build": every answer of hers that can change the programming — her recovery
 * flags and note, her allergies and intolerances — each with where it came from. Nothing to
 * show = no card.
 */
export function AttentionCard({ items }: AttentionCardProps) {
  const copy = useCopy(traineesCopy);
  if (items.length === 0) return null;
  return (
    <section className="attention-card">
      <h2 className="attention-title">
        <span aria-hidden="true">⚠</span> {copy.attentionTitle}
      </h2>
      <ul className="attention-list">
        {items.map((item) => (
          <li key={item.id} className="attention-item">
            <span className="attention-source">{item.source}</span>
            <span dir="auto">{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
