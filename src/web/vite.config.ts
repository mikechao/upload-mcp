import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, '../../dist/ui/web'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'chatgpt-app.html'),
    },
  },
});
