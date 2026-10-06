import { CHART_RANGES } from '@sistem/shared';
import type { ChartRange } from '@sistem/shared';
import { BODY_COPY } from '../../data/bodyCopy';
import './RangePicker.css';

interface RangePickerProps {
  value: ChartRange;
  onChange: (range: ChartRange) => void;
}

/** 1M / 3M / 6M / 1Y / All — one row of toggles above the chart. */
export function RangePicker({ value, onChange }: RangePickerProps) {
  return (
    <div className="range-picker" role="group" aria-label={BODY_COPY.rangeLabel}>
      {CHART_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          className={'range-picker-option' + (range === value ? ' range-picker-option-active' : '')}
          aria-pressed={range === value}
          onClick={() => onChange(range)}
        >
          {BODY_COPY.ranges[range]}
        </button>
      ))}
    </div>
  );
}
