import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { I18nProvider } from '@sistem/shared';
import { AuthProvider } from '../../services/auth/AuthContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    // Language outermost (Phase 15): Hebrew / RTL from the first paint, before the session loads.
    <I18nProvider>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </I18nProvider>
  );
}
