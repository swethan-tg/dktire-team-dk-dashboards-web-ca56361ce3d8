import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@public': path.resolve(__dirname, 'public'),
      '@shared': path.resolve(__dirname, 'src/app/shared'),
      '@core': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
  },
});
