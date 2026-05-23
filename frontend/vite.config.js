import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// API target can be overridden so the same image works locally and in docker-compose.
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': API_TARGET,
    },
  },
});
