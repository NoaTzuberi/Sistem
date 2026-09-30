import type { ReactNode } from 'react';
import { AppShell } from '../AppShell/AppShell';
import './PlaceholderPage.css';

interface PlaceholderPageProps {
  title: string;
  children?: ReactNode;
}

// Stand-in for tab screens that are built in later phases. Placeholder copy only.
export function PlaceholderPage({ title, children }: PlaceholderPageProps) {
  return (
    <AppShell>
      <section className="placeholder-page">
        <h1 className="placeholder-page-title">{title}</h1>
        <p className="placeholder-page-text">Coming soon.</p>
        {children}
      </section>
    </AppShell>
  );
}
