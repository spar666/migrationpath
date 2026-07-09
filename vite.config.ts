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
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('@radix-ui')) {
                return 'ui';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('lucide-react') || id.includes('framer-motion')) {
                return 'vendor';
              }
              if (id.includes('@react-pdf/renderer') || id.includes('pako')) {
                return 'pdf-libs';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    // Configure Vercel-compatible output
    assetsDir: 'assets',
    base: '/',
  };
});
