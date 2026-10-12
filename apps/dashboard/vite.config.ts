import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The sub-path the app is served from. Set only by the GitHub Pages workflow
// (.github/workflows/deploy.yml); everywhere else the app lives at the root.
const basePath = process.env.SISTEM_BASE_PATH ?? '/'

// Port 5174 so the dashboard runs next to the mobile app (5173) with `npm run dev:all`.
export default defineConfig({
  base: basePath,
  plugins: [react()],
  server: { port: 5174, strictPort: true },
})
