import { IconExternalLink } from '@tabler/icons-react';
import { useCopy } from '@sistem/shared';
import { COACH_DASHBOARD_URL } from '../../../../app/config/env';
import { openExternal } from '../../../../services/external/openExternal';
import { coachCopy } from '../../copy';
import './DashboardLinkRow.css';

/** Coach Profile: opens the full web dashboard. Hidden when no address is set. */
export function DashboardLinkRow() {
  const copy = useCopy(coachCopy);
  const url = COACH_DASHBOARD_URL;
  if (!url) return null;

  return (
    <button type="button" className="dashboard-link-row" onClick={() => openExternal(url)}>
      <span>{copy.openFullDashboard}</span>
      <IconExternalLink size={20} aria-hidden="true" />
    </button>
  );
}
