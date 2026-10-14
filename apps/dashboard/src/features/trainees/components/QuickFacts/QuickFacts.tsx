import { Icon } from '../../../../components/common/Icon/Icon';
import type { IconName } from '../../../../components/common/Icon/iconPaths';
import './QuickFacts.css';

export interface QuickFact {
  id: 'goal' | 'days' | 'plan' | 'consistency';
  label: string;
  value: string;
}

/** Each fact's icon; its color comes from its id (QuickFacts.css). */
const ICONS: Record<QuickFact['id'], IconName> = {
  goal: 'target',
  days: 'calendar',
  plan: 'dumbbell',
  consistency: 'trend',
};

/** Four facts about her in a 2 × 2 grid of small colored tiles. */
export function QuickFacts({ facts }: { facts: QuickFact[] }) {
  return (
    <dl className="tqv-facts">
      {facts.map((fact) => (
        <div key={fact.id} className="tqv-fact" data-fact={fact.id}>
          <span className="tqv-fact-icon" aria-hidden="true">
            <Icon name={ICONS[fact.id]} size="sm" />
          </span>
          <dt className="tqv-fact-label">{fact.label}</dt>
          <dd className="tqv-fact-value">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
