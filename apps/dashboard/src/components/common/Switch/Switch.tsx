import type { ReactNode } from 'react';
import './Switch.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Its visible name, after the switch. */
  label: ReactNode;
  disabled?: boolean;
  /** Placement only (the switch keeps its own look). */
  className?: string;
}

/** The dashboard's on / off control: an iOS switch, Cherry Rose when on (no green). A real checkbox under it. */
export function Switch({ checked, onChange, label, disabled, className }: SwitchProps) {
  return (
    <label className={['switch', disabled && 'switch-disabled', className].filter(Boolean).join(' ')}>
      <input
        className="switch-input"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switch-track" aria-hidden="true" />
      <span className="switch-label">{label}</span>
    </label>
  );
}
