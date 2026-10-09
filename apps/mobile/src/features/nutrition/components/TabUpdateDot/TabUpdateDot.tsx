import { useCopy } from '@sistem/shared';
import { nutritionCopy } from '../../copy';
import './TabUpdateDot.css';

/** The dot on a tab's icon when something new was published since she last opened it. */
export function TabUpdateDot({ visible }: { visible: boolean }) {
  const copy = useCopy(nutritionCopy);
  if (!visible) return null;
  return (
    <span className="tab-update-dot">
      <span className="tab-update-dot-label">{copy.tabUpdated}</span>
    </span>
  );
}
