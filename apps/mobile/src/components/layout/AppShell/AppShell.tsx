import type { ReactNode } from 'react';
import { TabBar } from '../TabBar/TabBar';
import { usePageEnter } from '../../../hooks/usePageEnter';
import './AppShell.css';

interface AppShellProps {
  children: ReactNode;
  /** Focused flows (onboarding) render without the bottom tab bar. */
  hideTabBar?: boolean;
}

export function AppShell({ children, hideTabBar = false }: AppShellProps) {
  const mainRef = usePageEnter<HTMLElement>();

  return (
    <div className={'app-shell' + (hideTabBar ? '' : ' app-shell-with-tabs')}>
      <main className="app-shell-main" ref={mainRef}>
        {children}
      </main>
      {!hideTabBar && <TabBar />}
    </div>
  );
}
