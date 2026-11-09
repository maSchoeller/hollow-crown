/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { parse } from 'yaml';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { packsPlugin } from './tools/build/packs-plugin.ts';
import { CONTENT_HASHED } from './tools/build/precache.ts';
import { firstMissionFiles } from './tools/build/first-mission.mjs';

const packs = packsPlugin();

/**
 * The core worker (src/worker, story 2.8) is bundled apart from the app and gets only what it needs of the plugins: the
 * virtual pack modules (own instance; the build steps of `packs` that write packs.json and sort files stay with the
 * app's instance) and the YAML transform.
 */
function workerPlugins(): Plugin[] {
  const { configResolved, buildStart, resolveId, load } = packsPlugin();
  return [{ name: 'hc-packs-worker', enforce: 'pre', configResolved, buildStart, resolveId, load } as Plugin, yamlPlugin()];
}

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
 * Writes `precache-info.json` (file count and bytes of the first download) next to the service worker, for the stone
 * "Spiel wird vorbereitet" (story 7.6). The file is not in the precache itself: it is written after the list is made.
 */
function precacheInfo<E extends { size: number }>(outDir: string, entries: E[]): { manifest: E[] } {
  try {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      `${outDir}/precache-info.json`,
      JSON.stringify({ count: entries.length, bytes: entries.reduce((n, e) => n + e.size, 0) }),
    );
  } catch {
    // the stone then shows no size
  }
  return { manifest: entries };
}

/**
 * `vite build --mode perf` (pnpm perf, story 7.5) builds into dist-perf and adds the bench page of the performance run
 * (tests/perf/bench.html); the normal build never contains it.
 */
export default defineConfig(({ mode }) => {
  const perf = mode === 'perf';
  const outDir = perf ? 'dist-perf' : 'dist';
  return {
    base,
    worker: { format: 'es', plugins: workerPlugins },
    plugins: [
      packs,
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
          globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2,json,webm,m4a,mp3,txt}'],
          dontCacheBustURLsMatching: CONTENT_HASHED,
          runtimeCaching: [
            {
              /*
               * Everything under assets/ that is not precached: the files of the other packs (act1: places, half figures,
               * world map, sprites, item images, models, music; the pack's content chunk). Cache first across all caches,
               * so a pack cache `hc-pack-<id>-<hash>` (story 7.2) answers as well as the on-demand cache. A miss is fetched
               * and kept in `hc-on-demand` (ON_DEMAND_CACHE in src/packs/cacheName.ts, story 7.6), except requests
               * of the pack download (header x-hc-pack), which the pack cache keeps. The functions are copied into sw.js
               * as source text: they must not use anything from this file. `ignoreVary`: files are stored under their URL
               * alone, while a module import sends an Origin header that a `Vary` answer would otherwise compare.
               * The pack download (header x-hc-pack) skips the caches and always asks the network: the files keep plain
               * names, so an older copy in `hc-on-demand` or in the cache of the previous pack version would otherwise
               * be copied into the new pack cache and an update would never deliver changed files.
               */
              urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.includes('/assets/'),
              handler: async ({ request }) => {
                if (request.headers.has('x-hc-pack')) return fetch(request);
                const hit = await caches.match(request, { ignoreVary: true });
                if (hit) return hit;
                const res = await fetch(request);
                if (res.ok) {
                  const cache = await caches.open('hc-on-demand');
                  await cache.put(request, res.clone());
                }
                return res;
              },
            },
          ],
          /*
           * Only core is precached; the other packs load in the background (story 7.2) or when first shown. Added to
           * it: the first mission's files (tools/build/first-mission.mjs: prologue unit models, weapon and prop models,
           * battle music), so that a new campaign starts offline right after the first load, even when the act pack
           * is not complete yet. Decision 2026-10-25, budget 30 MB. These files keep plain names, hence a revision.
           */
          manifestTransforms: [
            (entries) =>
              precacheInfo(outDir, [
                ...entries.filter((e) => !packs.nonCorePaths().has(e.url)),
                ...firstMissionFiles(outDir)
                  .filter((p) => !entries.some((e) => e.url === p && !packs.nonCorePaths().has(p)))
                  .map((p) => ({
                    url: p,
                    size: statSync(`${outDir}/${p}`).size,
                    revision: createHash('md5').update(readFileSync(`${outDir}/${p}`)).digest('hex'),
                  })),
              ]),
          ],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          navigateFallback: 'index.html',
        },
      }),
    ],
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 2500,
      outDir,
      ...(perf ? { rollupOptions: { input: { main: 'index.html', bench: 'tests/perf/bench.html' } } } : {}),
    },
    test: {
      include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
      environment: 'node',
      // content YAML is parsed once per run, not once per test file (tests/setup)
      globalSetup: ['tests/setup/content-global.ts'],
      setupFiles: ['tests/setup/content-worker.ts'],
      // The heavy tests play whole battles and are CPU-bound; the default of one worker per logical core put 11 of them on 6 physical
      // cores, and several checkouts run their checks at the same time, so each battle took two to three times as long as alone and
      // tripped the timeout. Half the logical cores is about one worker per physical core. CI runners are dedicated: default there.
      ...(process.env.CI ? {} : { maxWorkers: '50%' }),
      // Alone (one worker, 2026-11-06) all but 14 tests stay under 2 s; coverage on a busy machine made tests up to six times slower,
      // so 15 s still catches hangs without tripping on load. The tests over 2 s alone (whole battles) carry their own timeout.
      testTimeout: 15_000,
      coverage: {
        provider: 'v8',
        // core, and since review 2026-11-07 (M4) the release-critical persistence (migrations, import) and content
        // (loading, validation). src/packs stays out: its cache and loader need the browser's Cache API (tests/e2e).
        include: ['src/core/**/*.ts', 'src/persistence/**/*.ts', 'src/content/**/*.ts'],
        exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
        reporter: ['text-summary', 'html'],
        // Ratchet per layer at the level measured (core: target 90 %, see AGENTS.md); raise whenever coverage improves, never lower.
        // Vitest counts every included file into a global threshold too, so there is none: each layer has its own.
        thresholds: {
          'src/core/**/*.ts': { statements: 95, branches: 90, functions: 96, lines: 97 },
          'src/persistence/**/*.ts': { statements: 91, branches: 92, functions: 85, lines: 92 }, // measured 2026-11-08: 91.3 / 92.3 / 85.9 / 93.0
          'src/content/**/*.ts': { statements: 94, branches: 88, functions: 98, lines: 99 }, // measured 2026-11-08: 94.8 / 88.7 / 98.5 / 99.4
        },
      },
    },
  };
});
