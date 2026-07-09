import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from "vite-plugin-node-polyfills";

import { createRequire } from "module";

const require = createRequire(import.meta.url);

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  const isProd = mode === "production";

  return {
    server: {
      host: "::",
      port: isDev ? 8080 : undefined,
      hmr: {
        overlay: false,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      isDev && componentTagger(),
      // Provides browser polyfills for Node.js built-in modules
      // Necessary for @react-pdf and related packages
      nodePolyfills({
        include: ["events", "util", "buffer", "stream", "process", "zlib"],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ].filter(Boolean),
    resolve: {
      alias: [
        { find: "@", replacement: path.resolve(__dirname, "./src") },
        // Direct pako deep imports (e.g. from pdfkit) to the root pako package
        // This resolves issues with PnP where nested file paths might not be accessible
        { find: /^pako\/lib\/.*/, replacement: require.resolve("pako") },
      ],
    },
    css: {
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer'),
        ],
      },
    },
    build: {
      sourcemap: isDev,
      chunkSizeWarningLimit: 1000,
      minify: !isDev ? "esbuild" : false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'framer-motion'],
            'pdf-libs': ['@react-pdf/renderer', 'pako'],
            ui: [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-aspect-ratio',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-collapsible',
              '@radix-ui/react-context-menu',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-hover-card',
              '@radix-ui/react-label',
              '@radix-ui/react-menubar',
              '@radix-ui/react-navigation-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-progress',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slider',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group',
              '@radix-ui/react-tooltip',
              'cmdk',
            ],
          },
        },
      },
    },
    // Configure Vercel-compatible output
    assetsDir: 'assets',
    base: '/',
  };
});
