/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { parse } from 'yaml';
import { ON_DEMAND_CACHE, ON_DEMAND_MUSIC } from './src/app/loading/cacheName.ts';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

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

/**
 * public/assets folders not precached (decision 2026-10-24): places, half figures and the world map, then (PO decision
 * "mehr nachladen statt Budget erhöhen") sprite sheets (a fallback for the 2D setting and units without a model) and
 * item images (menus show the frame until the picture is there). Music tracks follow by name (`ON_DEMAND_MUSIC`).
 */
const ON_DEMAND_ASSETS = ['locations', 'busts', 'halves', 'world', 'sprites', 'items'];

/**
 * On-demand image folders are cached by their URL (`CacheFirst`), so a picture that is redrawn under the same name would
 * never reach a player who has the old one. These folders therefore get a revision (a hash of their files) that
 * `src/ui/asset.ts` appends as `?v=`: the URL, and with it the cache entry, changes exactly when a picture does.
 * Models, sprites and music stay unversioned (large, and not replaced in place). Empty without `pnpm art:build`.
 */
const REVISIONED_ASSETS = ['halves', 'busts', 'items', 'locations', 'world'];

function assetRevisions(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const dir of REVISIONED_ASSETS) {
    const root = `public/assets/${dir}`;
    if (!existsSync(root)) continue;
    const hash = createHash('sha1');
    for (const f of readdirSync(root).sort()) hash.update(f).update(readFileSync(`${root}/${f}`));
    out[dir] = hash.digest('hex').slice(0, 8);
  }
  return out;
}

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
  define: { __ASSET_REVISIONS__: JSON.stringify(assetRevisions()) },
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
        globIgnores: [...ON_DEMAND_ASSETS.map((d) => `assets/${d}/**`), ...ON_DEMAND_MUSIC.map((m) => `assets/audio/${m}.mp3`)],
        runtimeCaching: [
          {
            urlPattern: new RegExp(`/assets/((${RUNTIME_CACHED.join('|')})/|audio/(${ON_DEMAND_MUSIC.join('|')})[.]mp3)`),
            handler: 'CacheFirst',
            options: { cacheName: ON_DEMAND_CACHE, expiration: { maxEntries: 1000 } },
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
