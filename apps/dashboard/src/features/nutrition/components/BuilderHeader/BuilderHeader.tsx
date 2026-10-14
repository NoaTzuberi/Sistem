import { Link } from 'react-router-dom';
import { useCopy, useI18n } from '@sistem/shared';
import { initialsOf } from '../../../../components/common/Avatar/initials';
import { Icon } from '../../../../components/common/Icon/Icon';
import { nutritionCopy } from '../../copy';
import type { SaveStatus } from '../../hooks/useNutritionEditor';
import './BuilderHeader.css';

interface BuilderHeaderProps {
  traineeName: string;
  backTo: string;
  /** draft: never published, or changed since; live: what she sees is what is here. */
  status: 'draft' | 'live';
  /** "Never published" / "Version 2 published 12 Oct, 10:40". */
  meta: string;
  saveStatus: SaveStatus;
  onRetry: () => void;
  publishLabel: string;
  /** Required checks that fail: the button only shows where to go. */
  blockers: number;
  /** Nothing changed since the last version (or a publish is running). */
  publishDisabled: boolean;
  onPublish: () => void;
  onBlockedPublish: () => void;
}

/** The builder's sticky glass bar: who, the plan's state, the autosave, and publishing. */
export function BuilderHeader({ traineeName, backTo, status, meta, saveStatus, onRetry, publishLabel, blockers, publishDisabled, onPublish, onBlockedPublish }: BuilderHeaderProps) {
  const copy = useCopy(nutritionCopy);
  const { plural } = useI18n();
  const b = copy.builder;
  const isBlocked = blockers > 0;

  return (
    <header className="nb-header">
      <Link className="nb-header-back" to={backTo} aria-label={b.back}>
        <Icon name="chevron" size="sm" flip />
      </Link>
      <span className="nb-header-avatar" aria-hidden="true">
        {initialsOf(traineeName)}
      </span>
      <div className="nb-header-title">
        <h1 className="nb-header-name">
          {b.title} <span className="nb-header-muted">· <bdi>{traineeName}</bdi></span>
        </h1>
        <p className="nb-header-meta">
          <span className="nb-header-status" data-status={status}>
            <span className="nb-header-dot" aria-hidden="true" />
            {status === 'live' ? b.statusLive : b.statusDraft}
          </span>
          <span>{meta}</span>
          <span className="nb-header-save" data-status={saveStatus} role="status">
            {saveStatus === 'error' ? (
              <>
                {b.saveFailed} ·{' '}
                <button className="nb-header-retry" type="button" onClick={onRetry}>
                  {b.retry}
                </button>
              </>
            ) : saveStatus === 'saved' ? (
              b.saved
            ) : (
              b.saving
            )}
          </span>
        </p>
      </div>
      <div className="nb-header-publish">
        {isBlocked && <small className="nb-header-blockers">{plural(b.blockers, blockers)}</small>}
        <button
          className="nb-header-publish-button"
          type="button"
          aria-disabled={isBlocked || undefined}
          disabled={!isBlocked && publishDisabled}
          onClick={isBlocked ? onBlockedPublish : onPublish}
        >
          {publishLabel}
        </button>
      </div>
    </header>
  );
}
