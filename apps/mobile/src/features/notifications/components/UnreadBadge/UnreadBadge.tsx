import { useCopy, useI18n } from '@sistem/shared';
import { appCopy } from '../../../../copy';
import { useUnreadCount } from '../../unreadCount';
import './UnreadBadge.css';

/** The unread count on the Inbox tab; nothing when everything is read. */
export function UnreadBadge() {
  const count = useUnreadCount();
  const copy = useCopy(appCopy);
  const { plural } = useI18n();
  if (count === 0) return null;

  return (
    <span className="unread-badge">
      <span aria-hidden="true">{count > 99 ? '99+' : count}</span>
      <span className="unread-badge-label">{plural(copy.unread, count)}</span>
    </span>
  );
}
