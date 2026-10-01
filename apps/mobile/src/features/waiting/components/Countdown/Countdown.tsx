import './Countdown.css';

interface CountdownProps {
  /** Time left, already computed from server time by the page. */
  remainingMs: number;
  label: string;
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export function Countdown({ remainingMs, label }: CountdownProps) {
  // Rounded up so the last second shows 00:00:01, not 00:00:00.
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="countdown" role="timer" aria-label={label}>
      {twoDigits(hours)}:{twoDigits(minutes)}:{twoDigits(seconds)}
    </div>
  );
}
