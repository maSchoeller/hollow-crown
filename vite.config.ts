/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { parse } from 'yaml';

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

export default defineConfig({
  base,
  plugins: [
    yamlPlugin(),
    preact(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Hollow Crown',
        short_name: 'Hollow Crown',
        description: 'Taktik-RPG – Der König ist tot. Die Krone ist verschwunden.',
        lang: 'de',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#141B2D',
        theme_color: '#141B2D',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2,json,webm,m4a,mp3}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  build: { target: 'es2022', chunkSizeWarningLimit: 2500 },
  test: {
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: { provider: 'v8', include: ['src/core/**/*.ts'], exclude: ['src/core/**/*.test.ts'], reporter: ['text-summary', 'html'] },
  },
});
