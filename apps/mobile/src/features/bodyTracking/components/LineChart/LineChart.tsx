import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { buildLineChart, nearestPointIndex } from '@sistem/shared';
import type { ChartPoint, ChartSize } from '@sistem/shared';
import './LineChart.css';

interface LineChartProps {
  points: ChartPoint[];
  ariaLabel: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const HEIGHT = 200;
const PADDING: ChartSize['padding'] = { top: 12, right: 14, bottom: 26, left: 40 };
// Past this many points the dots would crowd the line: only the selected one is drawn.
const MAX_DOTS = 40;

/**
 * One series over time (weight, or one measurement), drawn from the shared chart math.
 * Touch or drag across it: the crosshair snaps to the nearest date and the screen shows
 * that point's value above the chart. Arrow keys do the same.
 */
export function LineChart({ points, ariaLabel, selectedIndex, onSelect }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const geometry = width > 0 ? buildLineChart(points, { width, height: HEIGHT, padding: PADDING }) : null;
  const selected = geometry?.points[selectedIndex];

  function selectAt(event: PointerEvent<SVGSVGElement>) {
    if (!geometry) return;
    const box = event.currentTarget.getBoundingClientRect();
    onSelect(nearestPointIndex(geometry, event.clientX - box.left));
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === 'ArrowLeft') onSelect(Math.max(0, selectedIndex - 1));
    else if (event.key === 'ArrowRight') onSelect(Math.min(points.length - 1, selectedIndex + 1));
    else return;
    event.preventDefault();
  }

  return (
    <div className="line-chart" ref={containerRef}>
      {geometry && (
        <svg
          className="line-chart-svg"
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onPointerDown={selectAt}
          onPointerMove={(event) => {
            // A finger drag scrubs; a mouse only while pressed.
            if (event.pointerType !== 'mouse' || event.buttons === 1) selectAt(event);
          }}
          onKeyDown={handleKeyDown}
        >
          {geometry.yTicks.map((tick) => (
            <g key={tick.value}>
              <line className="line-chart-grid" x1={geometry.plot.left} x2={geometry.plot.right} y1={tick.y} y2={tick.y} />
              <text className="line-chart-axis-label" x={geometry.plot.left - 6} y={tick.y} textAnchor="end" dominantBaseline="middle">
                {tick.value}
              </text>
            </g>
          ))}
          {geometry.xTicks.map((tick, index) => (
            <text
              key={index}
              className="line-chart-axis-label"
              x={tick.x}
              y={HEIGHT - 6}
              textAnchor={index === 0 ? 'start' : index === geometry.xTicks.length - 1 ? 'end' : 'middle'}
            >
              {tick.label}
            </text>
          ))}
          {selected && (
            <line className="line-chart-crosshair" x1={selected.x} x2={selected.x} y1={geometry.plot.top} y2={geometry.plot.bottom} />
          )}
          <path className="line-chart-line" d={geometry.path} />
          {geometry.points.length <= MAX_DOTS &&
            geometry.points.map((point) => <circle key={point.date} className="line-chart-dot" cx={point.x} cy={point.y} r={4} />)}
          {selected && <circle className="line-chart-dot line-chart-dot-selected" cx={selected.x} cy={selected.y} r={6} />}
        </svg>
      )}
    </div>
  );
}
