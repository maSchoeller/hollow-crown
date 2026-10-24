/** Revisions of the image folders that are cached by URL (vite.config.ts `REVISIONED_ASSETS`); empty in tests and without `pnpm art:build`. */
declare const __ASSET_REVISIONS__: Record<string, string> | undefined;
const revisions: Record<string, string> = typeof __ASSET_REVISIONS__ === 'undefined' ? {} : __ASSET_REVISIONS__;

/** URL of a built asset under public/assets (pnpm art:build); a redrawn picture gets a new URL (`?v=`), so no cache keeps the old one. */
export const asset = (p: string): string => {
  const rev = revisions[p.split('/', 1)[0]!];
  return `${import.meta.env.BASE_URL}assets/${p}${rev ? `?v=${rev}` : ''}`;
};
