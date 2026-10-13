import type { ReactNode } from 'react';
import { useElementWidth } from '../../hooks/useElementWidth';
import './ChartFrame.css';

export const CHART_HEIGHT = 230;
const FALLBACK_WIDTH = 600;

interface ChartFrameProps {
  /** The same numbers as text ("label: value"), for screen readers. */
  dataLines: string[];
  /** Shown instead of the chart when there is nothing to draw. */
  empty?: string | null;
  /** Draws the SVG (and its hover tooltip) for the width the frame has. */
  children: (width: number) => ReactNode;
}

/** What every chart of the Statistics page shares: its box, its measured width, the empty state and the text version. */
export function ChartFrame({ dataLines, empty, children }: ChartFrameProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>(FALLBACK_WIDTH);
  return (
    <div className="chart-frame" ref={ref}>
      {empty ? (
        <p className="chart-empty">{empty}</p>
      ) : (
        <>
          {children(width)}
          <ul className="visually-hidden">
            {dataLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
