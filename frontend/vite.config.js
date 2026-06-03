import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };

// API target can be overridden so the same image works locally and in docker-compose.
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:8000';

// Version precedence:
//   1. VITE_APP_VERSION (set by CI / Dockerfile from the git tag)
//   2. package.json version (fallback for local dev)
const APP_VERSION = process.env.VITE_APP_VERSION || pkg.version;

export default defineConfig({
  plugins: [react()],
  define: {
    // Exposed as a literal string in the bundle (see frontend/src/App.jsx).
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': API_TARGET,
    },
  },
});
