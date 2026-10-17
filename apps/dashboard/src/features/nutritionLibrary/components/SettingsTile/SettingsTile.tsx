import type { PortionGroup } from '@sistem/types';
import type { FieldError } from '../../data/settingsForm';
import { SettingsStepper } from '../SettingsStepper/SettingsStepper';
import { FieldMessage } from '../FieldMessage/FieldMessage';
import './SettingsTile.css';

/** A portion group's colors, or one of the pace tiles' own tints. */
export type SettingsTileTone = PortionGroup | 'loss' | 'gain' | 'deficit' | 'neutral';

const TINTS = new Set<SettingsTileTone>(['loss', 'gain', 'deficit', 'neutral']);

interface SettingsTileProps {
  /** Its short name, shown on top. */
  name: string;
  /** What the number is in (shown under it). */
  unit: string;
  tone: SettingsTileTone;
  /** A dot in the group's color before the name (the portion split). */
  dot?: boolean;
  /** The stepper's full accessible name. */
  label: string;
  value: number | undefined;
  step: number;
  bounds: { min: number; max: number };
  onChange: (value: number | undefined) => void;
  error: FieldError | undefined;
  /** The id of its error line. */
  errorId: string;
}

/** A tinted settings tile: a name, a −/+ stepper and the unit, with its error line under them. */
export function SettingsTile({ name, unit, tone, dot = false, label, value, step, bounds, onChange, error, errorId }: SettingsTileProps) {
  const toneClass = TINTS.has(tone) ? `settings-tile-${tone}` : `settings-tile-group food-group-${tone}`;
  return (
    <div className={`settings-tile ${toneClass}`}>
      <span className="settings-tile-name">
        {dot && <span className="settings-tile-dot" aria-hidden="true" />}
        {name}
      </span>
      <SettingsStepper
        label={label}
        value={value}
        step={step}
        bounds={bounds}
        invalid={error !== undefined}
        describedBy={error ? errorId : undefined}
        onChange={onChange}
      />
      <span className="settings-tile-unit">{unit}</span>
      <FieldMessage id={errorId} error={error} />
    </div>
  );
}
