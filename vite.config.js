import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the React network visualization project.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 4173,
    strictPort: false,
    allowedHosts: [
      'raft-visualization-production.up.railway.app',
      '.railway.app'
    ]
  }
});