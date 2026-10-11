import './Countdown.css';

interface CountdownProps {
  /** Time left, already computed from server time by the page. */
  remainingMs: number;
  label: string;
  unitLabels: { hours: string; minutes: string; seconds: string };
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export function Countdown({ remainingMs, label, unitLabels }: CountdownProps) {
  // Rounded up so the last second shows 00:00:01, not 00:00:00.
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const units = [
    { id: 'hours', value: hours, label: unitLabels.hours },
    { id: 'minutes', value: minutes, label: unitLabels.minutes },
    { id: 'seconds', value: seconds, label: unitLabels.seconds },
  ];

  return (
    // A clock reads hours → seconds from left to right in Hebrew too.
    <div className="countdown" role="timer" aria-label={label} dir="ltr">
      {units.map((unit, index) => (
        <div className="countdown-part" key={unit.id}>
          {index > 0 && (
            <span className="countdown-separator" aria-hidden="true">
              :
            </span>
          )}
          <div className="countdown-unit">
            <span className="countdown-digits">{twoDigits(unit.value)}</span>
            <span className="countdown-unit-label">{unit.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
