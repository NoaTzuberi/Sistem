import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { fill, useCopy } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import type { NoticeItem } from '../../data/notificationItems';
import { notificationsCopy } from '../../copy';
import './NotificationItem.css';

// = --transition-notice: the card is removed once it has faded out.
const LEAVE_MS = 200;

interface NotificationItemProps {
  item: NoticeItem;
  /** Pressed (or its action button): mark it read and go where it points. */
  onOpen: (item: NoticeItem) => void;
  onDismiss: (item: NoticeItem) => void;
}

/**
 * One notification. Unread: a white card with a soft glow in its type's color and a dot. Read:
 * flat and quiet. The whole card opens it (click, Enter, Space); the ✕ fades it out and removes it.
 */
export function NotificationItem({ item, onOpen, onDismiss }: NotificationItemProps) {
  const copy = useCopy(notificationsCopy);
  const [isLeaving, setIsLeaving] = useState(false);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Only the card's own keys: Enter on the ✕ or the action button is theirs.
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onOpen(item);
  }

  function handleDismiss() {
    setIsLeaving(true);
    window.setTimeout(() => onDismiss(item), LEAVE_MS);
  }

  const classNames = ['notice', `notice-${item.type}`, !item.isUnread && 'notice-read', isLeaving && 'notice-leaving'].filter(Boolean).join(' ');

  return (
    <li className="notice-row">
      <div className={classNames} role="button" tabIndex={0} onClick={() => onOpen(item)} onKeyDown={handleKeyDown}>
        <span className="notice-icon" aria-hidden="true">
          <Icon name={item.icon} />
        </span>
        <div className="notice-text">
          <div className="notice-head">
            {/* Names inside the sentence are already isolated (their own direction). */}
            <span className="notice-title">{item.title}</span>
            {item.time && <span className="notice-time">{item.time}</span>}
          </div>
          {item.body && <p className="notice-body">{item.body}</p>}
          {item.action && (
            <button
              className="notice-action"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpen(item);
              }}
            >
              {item.action}
            </button>
          )}
        </div>
        {item.isUnread && <span className="notice-dot" aria-hidden="true" />}
        {item.canDismiss && (
          <button
            className="notice-dismiss"
            type="button"
            aria-label={fill(copy.dismiss, { title: item.title })}
            onClick={(event) => {
              event.stopPropagation();
              handleDismiss();
            }}
          >
            <Icon name="close" size="sm" className="notice-dismiss-icon" />
          </button>
        )}
      </div>
    </li>
  );
}
