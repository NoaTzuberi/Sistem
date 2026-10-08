import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './TabUpdateDot.css';

/** The dot on a tab's icon when something new was published since she last opened it. */
export function TabUpdateDot({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span className="tab-update-dot">
      <span className="tab-update-dot-label">{NUTRITION_COPY.tabUpdated}</span>
    </span>
  );
}
