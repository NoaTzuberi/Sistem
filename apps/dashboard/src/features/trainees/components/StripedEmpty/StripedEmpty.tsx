import { Icon } from '../../../../components/common/Icon/Icon';
import type { IconName } from '../../../../components/common/Icon/iconPaths';
import './StripedEmpty.css';

interface StripedEmptyProps {
  icon: IconName;
  text: string;
  /** small = a shorter panel (the photos card). */
  size?: 'regular' | 'small';
}

/** "Nothing here yet" inside a Body card: a striped panel with an icon and one line. */
export function StripedEmpty({ icon, text, size = 'regular' }: StripedEmptyProps) {
  return (
    <div className={size === 'small' ? 'striped-empty striped-empty-small' : 'striped-empty'}>
      <Icon name={icon} />
      <p className="striped-empty-text">{text}</p>
    </div>
  );
}
