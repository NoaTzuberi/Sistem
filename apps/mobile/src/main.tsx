import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@sistem/tokens/tokens.css'
// Legacy ATLAS variables for the kept screens — removed in Phase 2b.
import './styles/legacy-atlas.css'
import './styles/globals.css'
import './styles/typography.css'
import './styles/animations.css'
import App from './App.tsx'
import { AppProviders } from './app/providers/AppProviders'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
