import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// TODO: Add path aliases when src/ structure is defined.
export default defineConfig(() => ({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
}));
