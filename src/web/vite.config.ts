import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const widgetEntry = process.env.WIDGET_ENTRY ?? 'chatgpt-app.html';
const emptyOutDir = process.env.WIDGET_EMPTY_OUT_DIR !== 'false';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: resolve(__dirname, '../../dist/ui/web'),
    emptyOutDir,
    rollupOptions: {
      input: resolve(__dirname, widgetEntry),
    },
  },
});
