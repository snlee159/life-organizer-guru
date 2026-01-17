import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Ensure SPA routing works in development
    historyApiFallback: true,
  },
  preview: {
    // Ensure SPA routing works in preview mode
    port: 4173,
  },
  build: {
    // Ensure proper build output
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
