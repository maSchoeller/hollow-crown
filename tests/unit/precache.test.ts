import { describe, expect, it } from 'vitest';
import { CONTENT_HASHED } from '../../tools/build/precache';

describe('CONTENT_HASHED (precache entries without a revision)', () => {
  it('takes the files Vite names by content', () => {
    for (const f of [
      'assets/index-BCj1--33.js',
      'assets/index-B2TPDsz2.css',
      'assets/workbox-window.prod.es5-Bd17z0YL.js',
      'assets/barlow-latin-500-normal-BPAOfeC8.woff2',
      'assets/pbr.fragment-COHxB8X9.js',
    ]) {
      expect(CONTENT_HASHED.test(f), f).toBe(true);
    }
  });

  it('leaves the plain-named files of public/assets to the revision, so an update fetches them again', () => {
    for (const f of [
      'assets/manifest.json',
      'assets/fx/fx.json',
      'assets/audio/title.mp3',
      'assets/avatars/kael.webp',
      'assets/backgrounds/bg_camp_night.webp',
      'assets/locations/lager_unterwegs.webp',
      'assets/ground/water_0.png',
      'index.html',
      'packs.json',
    ]) {
      expect(CONTENT_HASHED.test(f), f).toBe(false);
    }
  });
});
