import type { ReactNode } from 'react';
import { fill, isolateLtr, useCopy } from '@sistem/shared';
import { planBuilderCopy } from '../../copy';
import './SlotSection.css';

const RING_RADIUS = 9;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

interface SlotSectionProps {
  name: string;
  /**
   * The slot's rule and "+ Add". Left out for the two plain groups: a free workout's exercises,
   * and "Other" (exercises of a typed workout that fit none of its slots).
   */
  slot?: { required: boolean; max: number; onAdd: () => void };
  /** How many exercises it holds now. */
  count: number;
  /** The exercise cards (and the AI's suggestions for an empty slot). */
  children: ReactNode;
}

/**
 * One slot of a typed workout as a soft container: a small ring (filled / max), its name,
 * required or optional, the count, and "+ Add" while there is room. Empty, it shows a dashed
 * placeholder line.
 */
export function SlotSection({ name, slot, count, children }: SlotSectionProps) {
  const copy = useCopy(planBuilderCopy);
  const filled = slot ? Math.min(1, count / Math.max(1, slot.max)) : 0;

  return (
    <section className="slot-section" aria-label={name}>
      <header className="slot-header">
        {slot && (
          <svg className="slot-ring" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="slot-ring-track" cx="12" cy="12" r={RING_RADIUS} />
            {/* The arc's length is data: an SVG attribute, since the dashboard has no inline styles.
                Nothing is drawn at 0 — a round line cap would still leave a dot. */}
            {filled > 0 && (
              <circle
                className="slot-ring-value"
                cx="12"
                cy="12"
                r={RING_RADIUS}
                strokeDasharray={`${(RING_LENGTH * filled).toFixed(1)} ${RING_LENGTH.toFixed(1)}`}
                transform="rotate(-90 12 12)"
              />
            )}
          </svg>
        )}
        <h3 className="slot-name">{name}</h3>
        {slot && <span className={slot.required ? 'slot-rule slot-rule-required' : 'slot-rule'}>{slot.required ? copy.slotRequired : copy.slotOptional}</span>}
        {slot && <span className="slot-count">{isolateLtr(fill(copy.slotCount, { count, max: slot.max }))}</span>}
        {/* A full slot has no "+ Add" (and the library refuses, with a toast, if it is tried anyway). */}
        {slot && count < slot.max && (
          <button className="slot-add" type="button" aria-label={fill(copy.addToSlotNamed, { slot: name })} onClick={slot.onAdd}>
            {copy.addToSlot}
          </button>
        )}
      </header>
      <ul className="slot-list">{children}</ul>
      {count === 0 && <p className="slot-empty">{slot ? copy.slotEmpty : copy.emptyWorkout}</p>}
    </section>
  );
}
