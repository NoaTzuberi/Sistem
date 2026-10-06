import { measurementLabel } from '@sistem/shared';
import { BODY_COPY } from '../../data/bodyCopy';
import './MeasurementPicker.css';

interface MeasurementPickerProps {
  ids: string[];
  value: string;
  onChange: (id: string) => void;
}

/** Which measurement the chart shows — a row of chips that scrolls sideways if needed. */
export function MeasurementPicker({ ids, value, onChange }: MeasurementPickerProps) {
  return (
    <div className="measurement-picker" role="group" aria-label={BODY_COPY.pickMeasurement}>
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          className={'measurement-picker-chip' + (id === value ? ' measurement-picker-chip-active' : '')}
          aria-pressed={id === value}
          onClick={() => onChange(id)}
        >
          {measurementLabel(id)}
        </button>
      ))}
    </div>
  );
}
