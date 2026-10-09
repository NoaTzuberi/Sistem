import { CHART_RANGES, useCopy } from '@sistem/shared';
import type { ChartRange } from '@sistem/shared';
import { bodyCopy } from '../../copy';
import './RangePicker.css';

interface RangePickerProps {
  value: ChartRange;
  onChange: (range: ChartRange) => void;
}

/** 1M / 3M / 6M / 1Y / All — one row of toggles above the chart. */
export function RangePicker({ value, onChange }: RangePickerProps) {
  const copy = useCopy(bodyCopy);
  return (
    <div className="range-picker" role="group" aria-label={copy.rangeLabel}>
      {CHART_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          className={'range-picker-option' + (range === value ? ' range-picker-option-active' : '')}
          aria-pressed={range === value}
          onClick={() => onChange(range)}
        >
          {copy.ranges[range]}
        </button>
      ))}
    </div>
  );
}
