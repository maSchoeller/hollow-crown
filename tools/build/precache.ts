/**
 * Files the service worker precaches without a revision (workbox `dontCacheBustURLsMatching`): only what Vite names by
 * content, `assets/<name>-<8 chars>.<ext>`. vite-plugin-pwa would take everything under `assets/` for that, but
 * `public/assets` (manifest.json, avatars, backgrounds, sounds, fx) keeps plain names; without a revision an update
 * never fetched them again and the app went on with the old `manifest.json` (no half figures in dialogues).
 */
export const CONTENT_HASHED = /^assets\/[^/]+-[A-Za-z0-9_-]{8}\.[A-Za-z0-9]+$/;
