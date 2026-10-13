import './ChartTooltip.css';

interface ChartTooltipProps {
  /** The hovered mark, in the chart frame's own pixels. */
  x: number;
  y: number;
  /** The frame's width: the card stays inside it. */
  frameWidth: number;
  /** The mark's name (a month, a week). */
  title: string;
  /** Its value, already formatted. */
  value: string;
  /** Under the value: the change from the mark before it, or the unit. */
  note: string;
  /** change = Cherry Rose (a comparison); quiet = muted (a unit). */
  noteTone: 'change' | 'quiet';
}

/** Half the widest card: closer to an edge than this and it would hang out of the frame. */
const EDGE_SPACE = 68;

/** The glass card over a hovered mark of a chart. It follows the pointer smoothly; screen readers get the chart's text list instead. */
export function ChartTooltip({ x, y, frameWidth, title, value, note, noteTone }: ChartTooltipProps) {
  const centerX = frameWidth < EDGE_SPACE * 2 ? frameWidth / 2 : Math.max(EDGE_SPACE, Math.min(frameWidth - EDGE_SPACE, x));
  return (
    // A computed position: the card sits on the hovered mark.
    <div className="chart-tooltip" role="presentation" style={{ transform: `translate(${centerX}px, ${y}px)` }}>
      <div className="chart-tooltip-card">
        <span className="chart-tooltip-title">{title}</span>
        <b className="chart-tooltip-value">
          <bdi>{value}</bdi>
        </b>
        <span className={noteTone === 'change' ? 'chart-tooltip-note chart-tooltip-change' : 'chart-tooltip-note'}>{note}</span>
      </div>
    </div>
  );
}
