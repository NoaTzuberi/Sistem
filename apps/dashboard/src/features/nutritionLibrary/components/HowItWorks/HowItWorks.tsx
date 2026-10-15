import type { IconName } from '../../../../components/common/Icon/iconPaths';
import { Icon } from '../../../../components/common/Icon/Icon';
import './HowItWorks.css';

export interface HowItWorksItem {
  id: string;
  icon: IconName;
  /** The icon tile's color: a portion-group identity color, never a status. */
  tone: 'protein' | 'carb' | 'fat';
  title: string;
  text: string;
}

/** Three small glass cards at the top of a tab: what this part of the library is for. */
export function HowItWorks({ label, items }: { label: string; items: HowItWorksItem[] }) {
  return (
    <ul className="how-it-works" aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className={`how-it-works-card food-group-${item.tone}`}>
          <span className="how-it-works-icon" aria-hidden="true">
            <Icon name={item.icon} size="sm" />
          </span>
          <span className="how-it-works-text">
            <strong className="how-it-works-title">{item.title}</strong>
            <span className="how-it-works-line">{item.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
