import './ChartHeadline.css';

interface ChartHeadlineProps {
  /** The current number, already formatted. */
  value: string;
  /** A short line under it ('+12 in the period', 'this week'). */
  note?: string;
}

/** The number a chart card leads with, at the end of its header. */
export function ChartHeadline({ value, note }: ChartHeadlineProps) {
  return (
    <p className="chart-headline">
      <b className="chart-headline-value">
        <bdi>{value}</bdi>
      </b>
      {note && <span className="chart-headline-note">{note}</span>}
    </p>
  );
}
