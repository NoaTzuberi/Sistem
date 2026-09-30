import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Port 5174 so the dashboard runs next to the mobile app (5173) with `npm run dev:all`.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
})
