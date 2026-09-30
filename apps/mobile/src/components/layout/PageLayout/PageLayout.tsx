import type { ReactNode } from 'react';
import { usePageEnter } from '../../../hooks/usePageEnter';
import './PageLayout.css';

interface PageLayoutProps {
  children: ReactNode;
}

// Minimal full-height layout for screens outside the app shell (auth pages and the
// ProtectedRoute gate). No website navigation — Sistem is an app, not a site.
export function PageLayout({ children }: PageLayoutProps) {
  const mainRef = usePageEnter<HTMLElement>();

  return (
    <div className="page-layout">
      <main className="page-layout-main" ref={mainRef}>
        {children}
      </main>
    </div>
  );
}
