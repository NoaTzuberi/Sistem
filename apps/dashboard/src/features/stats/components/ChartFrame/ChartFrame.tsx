import type { ReactNode } from 'react';
import { useElementWidth } from '../../hooks/useElementWidth';
import './ChartFrame.css';

export const CHART_HEIGHT = 230;
const FALLBACK_WIDTH = 600;

interface ChartFrameProps {
  /** The same numbers as text ("label: value"), for screen readers. */
  dataLines: string[];
  /** Draws the SVG (and its hover tooltip) for the width the frame has. */
  children: (width: number) => ReactNode;
}

/** What every chart of the Statistics page shares: its box, its measured width and the text version. */
export function ChartFrame({ dataLines, children }: ChartFrameProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>(FALLBACK_WIDTH);
  return (
    <div className="chart-frame" ref={ref}>
      {children(width)}
      <ul className="visually-hidden">
        {dataLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
