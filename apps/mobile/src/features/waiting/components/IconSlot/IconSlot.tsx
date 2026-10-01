import type { WaitingIcon } from '../../data/waitingIcons';
import './IconSlot.css';

interface IconSlotProps {
  icon: WaitingIcon;
  /** 1-based position, shown on the placeholder so an empty slot is easy to spot. */
  position: number;
}

// One icon of the waiting screen. Decorative, so hidden from screen readers.
// Icons are set in data/waitingIcons.ts — nothing to change here to swap one.
export function IconSlot({ icon, position }: IconSlotProps) {
  if (!icon.src) {
    return (
      <div className="icon-slot icon-slot-empty" aria-hidden="true">
        {position}
      </div>
    );
  }

  return (
    <div className="icon-slot" aria-hidden="true">
      <img className="icon-slot-image" src={icon.src} alt="" />
    </div>
  );
}
