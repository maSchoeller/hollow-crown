/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { parse } from 'yaml';
import { mkdirSync, writeFileSync } from 'node:fs';

/** Compiles content YAML to JSON modules at build time (content is validated by Zod at load). */
function yamlPlugin(): Plugin {
  return {
    name: 'hc-yaml',
    transform(code, id) {
      if (!/\.ya?ml$/.test(id)) return null;
      return { code: `export default ${JSON.stringify(parse(code))};`, map: null };
    },
  };
}

const base = process.env.BASE_PATH ?? '/';

/** public/assets folders not precached: places, half figures and the world map load on demand (decision 2026-10-24). */
const ON_DEMAND_ASSETS = ['locations', 'busts', 'world'];

/** Unit models are not in the glob either; they join the runtime cache so a mission's models stay available offline (story 7.6). */
const RUNTIME_CACHED = [...ON_DEMAND_ASSETS, 'models'];

/**
 * Writes `precache-info.json` (file count and bytes of the first download) next to the service worker, for the stone
 * "Spiel wird vorbereitet" (story 7.6). The file is not in the precache itself: it is written after the list is made.
 */
function precacheInfo<E extends { size: number }>(entries: E[]): { manifest: E[] } {
  try {
    mkdirSync('dist', { recursive: true });
    writeFileSync('dist/precache-info.json', JSON.stringify({ count: entries.length, bytes: entries.reduce((n, e) => n + e.size, 0) }));
  } catch {
    // the stone then shows no size
  }
  return { manifest: entries };
}

export default defineConfig({
  base,
  plugins: [
    yamlPlugin(),
    preact(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png', 'icons/*.ico'],
      manifest: {
        name: 'Hollow Crown',
        short_name: 'Hollow Crown',
        description: 'Taktik-RPG – Der König ist tot. Die Krone ist verschwunden.',
        lang: 'de',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFF8EC',
        theme_color: '#FFF8EC',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2,json,webm,m4a,mp3}'],
        // large pictures load when first shown and stay cached (initial-download budget, tools/check-bundle-size.mjs)
        globIgnores: ON_DEMAND_ASSETS.map((d) => `assets/${d}/**`),
        runtimeCaching: [
          {
            urlPattern: new RegExp(`/assets/(${RUNTIME_CACHED.join('|')})/`),
            handler: 'CacheFirst',
            options: { cacheName: 'hc-on-demand', expiration: { maxEntries: 400 } },
          },
        ],
        manifestTransforms: [(entries) => precacheInfo(entries)],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  build: { target: 'es2022', chunkSizeWarningLimit: 2500 },
  test: {
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts'],
      exclude: ['src/core/**/*.test.ts'],
      reporter: ['text-summary', 'html'],
      // Ratchet at the current level (target 90 %, see AGENTS.md); raise whenever coverage improves, never lower.
      thresholds: { statements: 70, branches: 60, functions: 75, lines: 76 },
    },
  },
});
