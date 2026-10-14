import type { TraineeTab } from '../../../../app/config/routes';
import { Icon } from '../../../../components/common/Icon/Icon';
import type { IconName } from '../../../../components/common/Icon/iconPaths';
import './ProfileLinksList.css';

export interface ProfileLink {
  tab: TraineeTab;
  label: string;
  /** Shown muted at the end, when one is known. */
  count?: number;
}

/** Each section's icon; its color comes from the section (ProfileLinksList.css). */
const ICONS: Record<TraineeTab, IconName> = {
  plans: 'dumbbell',
  logs: 'list',
  nutrition: 'utensils',
  metrics: 'body',
  onboarding: 'clipboard',
  achievements: 'award',
};

interface ProfileLinksListProps {
  title: string;
  links: ProfileLink[];
  onOpen: (tab: TraineeTab) => void;
}

/** Her full profile's sections as a grouped list: one row each, straight to that tab. */
export function ProfileLinksList({ title, links, onOpen }: ProfileLinksListProps) {
  return (
    <section className="tqv-links">
      <h3 className="tqv-links-title">{title}</h3>
      <ul className="tqv-links-group">
        {links.map((link) => (
          <li key={link.tab}>
            <button className="tqv-link" type="button" data-tab={link.tab} onClick={() => onOpen(link.tab)}>
              <span className="tqv-link-icon" aria-hidden="true">
                <Icon name={ICONS[link.tab]} size="sm" />
              </span>
              <span className="tqv-link-label">{link.label}</span>
              <span className="tqv-link-count">{link.count !== undefined && link.count > 0 ? link.count : null}</span>
              <span className="tqv-link-chevron" aria-hidden="true">
                <Icon name="chevron" size="sm" flip />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
