import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base to repository name for GitHub Pages deployment
  // Change 'fhir-ndjson-visualizer' to your actual repo name
  base: '/fhir-ndjson-visualizer/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
