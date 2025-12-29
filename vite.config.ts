import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import electron from 'vite-plugin-electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const aliasConfig = {
  find: /^@\//,
  replacement: path.resolve(__dirname, './src') + '/',
};

const config = defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        vite: {
          build: {
            rollupOptions: {
              output: {
                format: 'cjs',
                inlineDynamicImports: true,
                entryFileNames: 'preload.cjs',
              },
            },
          },
        },
      },
    ]),
  ],
  resolve: {
    alias: [aliasConfig],
  },
  base: './',
});

export default config;