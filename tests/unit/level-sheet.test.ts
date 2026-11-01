/** Level sheet (concept/27-ueberarbeitung/level-werkzeug.md): the sample draft is a valid map and the sheet draws its planning notes. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { mapSchema } from '../../src/content/schemas';
import { enemyCounts, renderSheet, sizeClass } from '../../tools/levels/sheet';

const draft = mapSchema.parse(parse(readFileSync('concept/27-ueberarbeitung/levels/muster_mittel_20x25.yaml', 'utf8')));
const ctx = { text: () => undefined, className: (id: string) => id, lieutenantClass: () => undefined };

describe('level sheet', () => {
  it('sorts sizes into the classes of the rework', () => {
    expect(sizeClass([16, 16])).toBe('klein');
    expect(sizeClass([20, 25])).toBe('mittel');
    expect(sizeClass([30, 40])).toBe('groß');
  });

  it('counts enemies per difficulty including waves and trigger spawns', () => {
    expect(enemyCounts(draft).normal).toEqual({ start: 19, later: 7 });
    expect(enemyCounts(draft).easy.start).toBe(17);
  });

  it('draws the grid, the planning notes and a mood prompt', () => {
    const sheet = renderSheet(draft, ctx);
    expect(sheet.svg.startsWith('<svg')).toBe(true);
    expect(sheet.summary).toMatchObject({ size: '20 × 25', sizeClass: 'mittel', deploy: 10, name: 'Muster: Sturm auf das Krähenfort' });
    expect(sheet.svg.match(/<polyline /g)?.length).toBe(2 * draft.design!.paths!.length);
    for (const s of ['P3 Runde 8–12', 'Hinterhalt im Westwald', 'R4', 'A1']) expect(sheet.svg).toContain(s);
    expect(sheet.moodPrompt).toContain('20 × 25');
    expect(sheet.moodPrompt).toContain('Nebel steigt vom Krähenbach');
  });
});
