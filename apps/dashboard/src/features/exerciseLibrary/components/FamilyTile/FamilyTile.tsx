import type { PatternId } from '@sistem/types';
import { familyInitials, patternGroupClass } from '../../data/patternGroups';
import './FamilyTile.css';

interface FamilyTileProps {
  name: string;
  /** Its first pattern colors the tile; none = a striped grey "?". */
  pattern: PatternId | undefined;
  size?: 'md' | 'lg';
}

/** A family's tile: a gradient in its pattern's color with its initials. Decorative — the name is next to it. */
export function FamilyTile({ name, pattern, size = 'md' }: FamilyTileProps) {
  const classNames = ['family-tile', `family-tile-${size}`, patternGroupClass(pattern), !pattern && 'family-tile-none'].filter(Boolean).join(' ');
  return (
    <span className={classNames} aria-hidden="true">
      {/* Initials of an English name read left to right. */}
      <span dir="ltr">{pattern ? familyInitials(name) : '?'}</span>
    </span>
  );
}
