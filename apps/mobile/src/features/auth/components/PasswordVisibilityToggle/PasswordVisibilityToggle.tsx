import { IconEye, IconEyeOff } from '@tabler/icons-react';
import './PasswordVisibilityToggle.css';

interface PasswordVisibilityToggleProps {
  visible: boolean;
  showLabel: string;
  hideLabel: string;
  onToggle: () => void;
}

export function PasswordVisibilityToggle({ visible, showLabel, hideLabel, onToggle }: PasswordVisibilityToggleProps) {
  return (
    <button
      type="button"
      className="password-visibility-toggle"
      aria-label={visible ? hideLabel : showLabel}
      aria-pressed={visible}
      onClick={onToggle}
    >
      {visible ? <IconEyeOff size={19} aria-hidden="true" /> : <IconEye size={19} aria-hidden="true" />}
    </button>
  );
}
