/** Model budget of the board figures (tools/figure-budget.mjs, figureBudget in content/packs.yaml, art-direction §4.6). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { figureBudgetSchema, parsePacks } from '../../src/content/packs';
// @ts-expect-error plain ES module of the build tooling, without type declarations
import { checkFigures, imageSize, measureGlb, readFigureBudget } from '../../tools/figure-budget.mjs';

const kael = join(process.cwd(), 'art', 'models', 'units', 'kael.glb');

describe('figure budget', () => {
  it('packs.yaml carries a valid figureBudget and still parses as packs', () => {
    const raw = parse(readFileSync(join(process.cwd(), 'content', 'packs.yaml'), 'utf8'));
    expect(figureBudgetSchema.parse(raw.figureBudget)).toMatchObject({ triangles: 7000, texture: 512 });
    expect(parsePacks(raw).length).toBeGreaterThan(0);
  });

  it('counts the triangles and the texture of a packed figure (Kael: 6385, art-direction §4.6)', () => {
    expect(measureGlb(readFileSync(kael))).toEqual({ triangles: 6385, texture: [512, 512] });
  });

  it('flags a figure over a limit and lets large ids have the factor', () => {
    const budget = { ...readFigureBudget(), triangles: 6000, large: [] as string[] };
    expect(checkFigures([kael], budget).outliers.map((r: { why: string[] }) => r.why)).toEqual([['triangles > 6000']]);
    expect(checkFigures([kael], { ...budget, large: ['kael'] }).outliers).toEqual([]);
  });

  it('reads the size from PNG, JPEG and WebP headers', () => {
    const png = Buffer.alloc(32);
    png.writeUInt32BE(0x89504e47, 0);
    png.writeUInt32BE(256, 16);
    png.writeUInt32BE(128, 20);
    expect(imageSize(png)).toEqual([256, 128]);
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0, 17, 8, 0x02, 0x00, 0x04, 0x00, 3, 0, 0, 0, 0, 0, 0]);
    expect(imageSize(jpg)).toEqual([1024, 512]);
    const webp = Buffer.alloc(40);
    webp.write('RIFF', 0, 'latin1');
    webp.write('WEBP', 8, 'latin1');
    webp.write('VP8X', 12, 'latin1');
    webp.writeUIntLE(511, 24, 3);
    webp.writeUIntLE(255, 27, 3);
    expect(imageSize(webp)).toEqual([512, 256]);
  });
});
