import { useUnreadCount } from '../../unreadCount';
import './UnreadBadge.css';

/** The unread count on the Inbox tab; nothing when everything is read. */
export function UnreadBadge() {
  const count = useUnreadCount();
  if (count === 0) return null;

  return (
    <span className="unread-badge">
      <span aria-hidden="true">{count > 99 ? '99+' : count}</span>
      <span className="unread-badge-label">{count} unread</span>
    </span>
  );
}
