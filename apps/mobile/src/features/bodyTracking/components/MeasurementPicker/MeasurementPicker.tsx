import { measurementLabel, useCopy, useLanguage } from '@sistem/shared';
import { bodyCopy } from '../../copy';
import './MeasurementPicker.css';

interface MeasurementPickerProps {
  ids: string[];
  value: string;
  onChange: (id: string) => void;
}

/** Which measurement the chart shows — a row of chips that scrolls sideways if needed. */
export function MeasurementPicker({ ids, value, onChange }: MeasurementPickerProps) {
  const language = useLanguage();
  const copy = useCopy(bodyCopy);
  return (
    <div className="measurement-picker" role="group" aria-label={copy.pickMeasurement}>
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          className={'measurement-picker-chip' + (id === value ? ' measurement-picker-chip-active' : '')}
          aria-pressed={id === value}
          onClick={() => onChange(id)}
        >
          {measurementLabel(id, language)}
        </button>
      ))}
    </div>
  );
}
