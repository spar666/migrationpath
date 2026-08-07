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
          /**
           * Order matters, and substring matching is the trap here: the old
           * rule tested `id.includes('react')` before the PDF rule, so
           * `@react-pdf/renderer` — which contains "react" — was pulled into
           * `vendor` along with everything it depends on. That is what made the
           * vendor chunk 2 MB, on every page, for a library only the prospectus
           * download uses.
           *
           * Heaviest and most specific packages are matched first, and matching
           * is anchored to the package path so a name cannot match by accident.
           */
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return;

            const inPackage = (name: string) =>
              id.includes(`node_modules/${name}`) ||
              id.includes(`node_modules/.pnpm/${name}`);

            // @react-pdf and its heavy transitive deps are returned as
            // undefined ON PURPOSE, which hands them to Rollup's automatic
            // splitting. They are reachable only through the dynamic
            // `import("@react-pdf/renderer")` at the two download call sites,
            // so Rollup puts them in an async chunk that loads on click.
            //
            // Neither alternative works: naming them makes Rollup emit a bare
            // side-effect import of that chunk from the entry, and letting the
            // `vendor` catch-all below take them pulls a megabyte into the
            // initial load. Both undo the lazy import.
            if (
              inPackage('@react-pdf') ||
              inPackage('fontkit') ||
              inPackage('browserify-zlib') ||
              inPackage('unicode-trie') ||
              inPackage('unicode-properties') ||
              inPackage('restructure')
            ) {
              return undefined;
            }
            if (inPackage('@radix-ui')) return 'ui';
            if (inPackage('recharts') || inPackage('d3-')) return 'charts';
            if (inPackage('framer-motion')) return 'motion';
            if (
              inPackage('react/') ||
              inPackage('react-dom') ||
              inPackage('react-router') ||
              inPackage('scheduler')
            ) {
              return 'react';
            }
            return 'vendor';
          },
        },
      },
    },
    // Configure Vercel-compatible output
    assetsDir: 'assets',
    base: '/',
  };
});
