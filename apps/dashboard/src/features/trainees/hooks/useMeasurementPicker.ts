import { useState } from 'react';
import type { MeasurementSeries } from '../data/bodySummary';

/** Which measurement the chart shows: the coach's pick, else the first one she has logged. */
export function useMeasurementPicker(series: MeasurementSeries[]): { selected: MeasurementSeries | undefined; select: (id: string) => void } {
  const [picked, setPicked] = useState<string | null>(null);
  const selected = series.find((entry) => entry.id === picked) ?? series.find((entry) => entry.values.length > 0) ?? series[0];
  return { selected, select: setPicked };
}
