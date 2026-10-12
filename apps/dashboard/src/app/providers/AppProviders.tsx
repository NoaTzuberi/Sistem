import { BrowserRouter, HashRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { I18nProvider } from '@sistem/shared';
import { AuthProvider } from '../../services/auth/AuthContext';
import { USES_HASH_ROUTER } from '../config/env';

const Router = USES_HASH_ROUTER ? HashRouter : BrowserRouter;

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    // Language outermost (Phase 15): Hebrew / RTL from the first paint, before the session loads.
    <I18nProvider>
      <Router>
        <AuthProvider>{children}</AuthProvider>
      </Router>
    </I18nProvider>
  );
}
