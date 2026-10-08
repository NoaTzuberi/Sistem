import { formatPortionCount } from '@sistem/shared';
import './PortionStepper.css';

const STEP = 0.5;

interface PortionStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** 0 for a meal's group; 0.5 for a line (a line always counts something). */
  min?: number;
  max?: number;
}

/** Portions in steps of 0.5 (PRD §5.6). */
export function PortionStepper({ label, value, onChange, min = 0, max = 10 }: PortionStepperProps) {
  return (
    <div className="portion-stepper" role="group" aria-label={label}>
      <span className="portion-stepper-label">{label}</span>
      <button type="button" className="portion-stepper-button" onClick={() => onChange(Math.max(min, value - STEP))} disabled={value <= min} aria-label={`${label} −0.5`}>
        −
      </button>
      <span className="portion-stepper-value" aria-live="polite">
        {formatPortionCount(value)}
      </span>
      <button type="button" className="portion-stepper-button" onClick={() => onChange(Math.min(max, value + STEP))} disabled={value >= max} aria-label={`${label} +0.5`}>
        +
      </button>
    </div>
  );
}
