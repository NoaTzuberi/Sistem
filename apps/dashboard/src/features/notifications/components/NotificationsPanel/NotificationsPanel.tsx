import { useState } from 'react';
import type { KeyboardEvent, Ref } from 'react';
import { fill, formatPlural, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { groupNotices } from '../../data/notificationItems';
import type { NoticeItem } from '../../data/notificationItems';
import { notificationsCopy } from '../../copy';
import { FilterSegment } from '../FilterSegment/FilterSegment';
import { NotificationItem } from '../NotificationItem/NotificationItem';
import './NotificationsPanel.css';

type Filter = 'all' | 'unread';

interface NotificationsPanelProps {
  id: string;
  panelRef: Ref<HTMLDivElement>;
  items: NoticeItem[];
  unreadCount: number;
  isLoading: boolean;
  error: 'load' | 'markRead' | undefined;
  onKeyDown: (event: KeyboardEvent) => void;
  onClose: () => void;
  onOpenItem: (item: NoticeItem) => void;
  onDismiss: (item: NoticeItem) => void;
  onMarkAllRead: () => void;
}

/**
 * The bell's panel: frosted glass under the bell, over a light blurred scrim. What needs the
 * coach first ("needs attention"), then today, then earlier; all or unread only.
 */
export function NotificationsPanel({ id, panelRef, items, unreadCount, isLoading, error, onKeyDown, onClose, onOpenItem, onDismiss, onMarkAllRead }: NotificationsPanelProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const inbox = shared.coach.inbox;
  const copy = useCopy(notificationsCopy);
  const [filter, setFilter] = useState<Filter>('all');
  const shown = filter === 'unread' ? items.filter((item) => item.isUnread) : items;
  const groups = groupNotices(shown, language);
  const titleId = `${id}-title`;

  return (
    <>
      <div className="notice-scrim" onClick={onClose} />
      <div className="notice-panel" id={id} ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onKeyDown={onKeyDown}>
        <header className="notice-panel-head">
          <div className="notice-panel-top">
            <h2 className="notice-panel-title" id={titleId}>
              {inbox.notificationsTitle}
              {unreadCount > 0 && <span className="notice-panel-count">{formatPlural(language, copy.newCount, unreadCount)}</span>}
            </h2>
            <button className="notice-panel-link" type="button" disabled={unreadCount === 0} onClick={onMarkAllRead}>
              {inbox.markAllRead}
            </button>
          </div>
          <FilterSegment
            label={copy.filterLabel}
            options={[
              { id: 'all', label: copy.filterAll },
              { id: 'unread', label: unreadCount > 0 ? fill(copy.filterUnreadCount, { count: unreadCount }) : copy.filterUnread },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </header>

        <div className="notice-panel-body">
          {error && (
            <p className="notice-panel-message" role="alert">
              {error === 'load' ? inbox.bellLoadError : inbox.markReadError}
            </p>
          )}
          {isLoading && <p className="notice-panel-message">{shared.common.loading}</p>}

          {groups.map((group) => (
            <section key={group.id} className="notice-group">
              <h3 className="notice-group-title">{group.title}</h3>
              <ul className="notice-list">
                {group.items.map((item) => (
                  <NotificationItem key={item.id} item={item} onOpen={onOpenItem} onDismiss={onDismiss} />
                ))}
              </ul>
            </section>
          ))}

          {!isLoading && error !== 'load' && shown.length === 0 && (
            <div className="notice-panel-empty">
              {filter === 'unread' ? (
                <>
                  <p className="notice-panel-empty-title">{copy.allReadTitle}</p>
                  <p>{copy.allReadBody}</p>
                </>
              ) : (
                <p>{inbox.empty}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
