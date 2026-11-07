/** Level sheet (concept/27-ueberarbeitung/level-werkzeug.md): the sample draft is a valid map and the sheet draws its planning notes. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { mapSchema } from '../../src/content/schemas';
import { enemyCounts, renderSheet, sizeClass, TERRAIN } from '../../tools/levels/sheet';

const draft = mapSchema.parse(parse(readFileSync('concept/27-ueberarbeitung/levels/muster_mittel_20x25.yaml', 'utf8')));
const ctx = { text: () => undefined, className: (id: string) => id, lieutenantClass: () => undefined };

describe('level sheet', () => {
  it('gives every terrain of terrain.yaml a colour, none is drawn as "?" (story 11.10)', () => {
    const ids = (parse(readFileSync('content/core/terrain.yaml', 'utf8')) as { id: string }[]).map((t) => t.id);
    for (const id of ['terrace', 'crag', 'ramp', 'stairs', 'ladder', 'vault', 'footbridge', 'gate_closed']) expect(ids).toContain(id);
    expect(ids.filter((id) => !TERRAIN[id]?.fill)).toEqual([]);
    // a strip of every terrain: no tile falls back to the grey "?" look
    const chars = ids.map((_, i) => String.fromCharCode(0x41 + i));
    const strip = { ...draft, size: [ids.length, 4] as [number, number], legend: Object.fromEntries(ids.map((id, i) => [chars[i]!, id])), terrain: `${chars.join('')}\n`.repeat(4), levels: [] };
    const sheet = renderSheet(strip, ctx);
    expect(sheet.svg).not.toContain('fill="#cccccc"');
  });

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
