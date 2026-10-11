import { ICON_PATHS } from './iconPaths';
import type { IconName } from './iconPaths';
import './Icon.css';

interface IconProps {
  name: IconName;
  size?: 'sm' | 'md';
  /** Direction icons (chevrons, the "open" arrow) mirror in right-to-left. */
  flip?: boolean;
  className?: string;
}

/** A decorative line icon — the control around it carries the accessible name. */
export function Icon({ name, size = 'md', flip = false, className }: IconProps) {
  const classNames = ['icon', `icon-${size}`, flip && 'flip-rtl', className].filter(Boolean).join(' ');
  return (
    <svg className={classNames} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {ICON_PATHS[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
