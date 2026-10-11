import { useId } from 'react';
import { IconCheck } from '@tabler/icons-react';
import { useI18n } from '@sistem/shared';
import { useWheelPicker } from '../../hooks/useWheelPicker';
import { arcLinePath } from '../../data/wheelGeometry';
import './ActivityWheel.css';

export interface ActivityWheelItem {
  id: string;
  label: string;
  /** The activity's emoji from the activity list. */
  icon: string;
}

interface ActivityWheelProps {
  items: readonly ActivityWheelItem[];
  selectedIds: readonly string[];
  /** The id of the question's heading: it names the listbox. */
  labelledBy: string;
  onToggle: (id: string) => void;
  /** The activity that reached the center row. */
  onCenterChange: (id: string) => void;
}

/**
 * The curved wheel picker: the items ride a big arc on the far side of the screen (left in
 * Hebrew, right in English). Drag, mouse wheel or arrow keys turn it; a tap on another item
 * brings it to the center; a tap on the centered one (or Space / Enter) marks it.
 */
export function ActivityWheel({ items, selectedIds, labelledBy, onToggle, onCenterChange }: ActivityWheelProps) {
  const { direction } = useI18n();
  const side = direction === 'rtl' ? 'left' : 'right';
  const baseId = useId();
  const { wheelRef, size, centerIndex, registerItem, wheelProps } = useWheelPicker({
    count: items.length,
    side,
    onActivate: (index) => onToggle(items[index].id),
    onCenterChange: (index) => onCenterChange(items[index].id),
  });

  return (
    <div
      ref={wheelRef}
      className={`activity-wheel activity-wheel-${side}`}
      role="listbox"
      aria-multiselectable="true"
      aria-labelledby={labelledBy}
      aria-activedescendant={`${baseId}-${centerIndex}`}
      tabIndex={0}
      {...wheelProps}
    >
      {size.height > 0 && (
        <svg className="activity-wheel-arc" width={size.width} height={size.height} aria-hidden="true">
          <path d={arcLinePath(size.width, size.height, side)} />
        </svg>
      )}
      <span className="activity-wheel-knob" aria-hidden="true" />

      {items.map((item, index) => {
        const isPicked = selectedIds.includes(item.id);
        const classNames = [
          'activity-wheel-item',
          index === centerIndex ? 'activity-wheel-item-center' : '',
          isPicked ? 'activity-wheel-item-picked' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div
            key={item.id}
            ref={registerItem(index)}
            id={`${baseId}-${index}`}
            className={classNames}
            role="option"
            aria-selected={isPicked}
            data-wheel-index={index}
          >
            <span className="activity-wheel-icon">
              <span className="activity-wheel-emoji" aria-hidden="true">
                {item.icon}
              </span>
              {isPicked && (
                <span className="activity-wheel-badge" aria-hidden="true">
                  <IconCheck size={12} stroke={3.6} />
                </span>
              )}
            </span>
            <span className="activity-wheel-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
