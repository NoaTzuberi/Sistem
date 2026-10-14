import type { PatternId } from '@sistem/types';
import { patternLabel, useCopy, useLanguage } from '@sistem/shared';
import { PATTERN_FILTERS } from '../../../planBuilder/data/exerciseFilters';
import { patternGroupClass } from '../../data/patternGroups';
import { exerciseLibraryCopy } from '../../copy';
import './PatternChips.css';

interface PatternChipsProps {
  value: PatternId | '';
  onChange: (pattern: PatternId | '') => void;
}

/** One chip per movement pattern, each with its color dot; the chosen one fills with its color. */
export function PatternChips({ value, onChange }: PatternChipsProps) {
  const language = useLanguage();
  const copy = useCopy(exerciseLibraryCopy);
  return (
    <div className="pattern-chips" role="group" aria-label={copy.pattern}>
      <button className="pattern-chip pattern-chip-all" type="button" aria-pressed={value === ''} onClick={() => onChange('')}>
        {copy.allPatterns}
      </button>
      {PATTERN_FILTERS.map((pattern) => (
        <button key={pattern} className={`pattern-chip ${patternGroupClass(pattern)}`} type="button" aria-pressed={value === pattern} onClick={() => onChange(pattern)}>
          <span className="pattern-chip-dot" aria-hidden="true" />
          {patternLabel(pattern, language)}
        </button>
      ))}
    </div>
  );
}
