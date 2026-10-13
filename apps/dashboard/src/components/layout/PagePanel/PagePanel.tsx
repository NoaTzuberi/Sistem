import { Outlet } from 'react-router-dom';
import './PagePanel.css';

/**
 * The pages that were not redesigned yet (nutrition, exercises)
 * were built on a white page: they sit on one white panel on the new canvas until their turn.
 */
export function PagePanel() {
  return (
    <div className="page-panel">
      <Outlet />
    </div>
  );
}
