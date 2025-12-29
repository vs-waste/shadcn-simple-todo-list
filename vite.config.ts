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

// Vite plugin to inject CSP meta tag conditionally
function injectCSPPlugin() {
  return {
    name: 'inject-csp',
    transformIndexHtml(html: string, context: any) {
      const isDev = context.server !== undefined;
      
      // Development CSP: allows unsafe-eval for Vite HMR
      const devCSP = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' http://localhost:*",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: http://localhost:*",
        "font-src 'self' data:",
        "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*",
      ].join('; ');

      // Production CSP: strict, no unsafe-eval
      const prodCSP = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self' data:",
        "connect-src 'self'",
      ].join('; ');

      const csp = isDev ? devCSP : prodCSP;
      const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${csp}" />`;
      
      // Inject CSP meta tag before </head>
      return html.replace('</head>', `    ${cspMeta}\n  </head>`);
    },
  };
}

const config = defineConfig({
  plugins: [
    react(),
    injectCSPPlugin(),
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