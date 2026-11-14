/**
 * Story 10.14: the castle model and the content agree. The places of the keepsakes and the parts per room level live in
 * the model (`tools/art/blender_castle.py`, `tools/art/blender_paktwacht.py`, decision 2026-11-06), `CASTLE_PLACES` names
 * them for the content check — so this test holds the three against each other, and against the exported file where it is
 * there (in Git LFS it is only a pointer text in a fresh checkout, like `tests/unit/pro-parts.test.ts`).
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { CASTLE_PLACES } from '../../src/core';

const { data } = loadContentFromDisk();
const castlePy = readFileSync('tools/art/blender_castle.py', 'utf8');
const scenePy = readFileSync('tools/art/blender_paktwacht.py', 'utf8');

/** the keys of the `KEEPSAKES` dict of blender_castle.py */
function keepsakeBuilders(): string[] {
  const block = /KEEPSAKES = \{(.*?)\n\}/s.exec(castlePy)?.[1] ?? '';
  return [...block.matchAll(/'([a-z]+)': keepsake_/g)].map((m) => m[1]!);
}

/** the keys of the `LAYOUT` dict of blender_paktwacht.py */
function layoutPlaces(): string[] {
  const block = /LAYOUT = \{(.*?)\n\}/s.exec(scenePy)?.[1] ?? '';
  return [...block.matchAll(/'([a-z]+)': \(/g)].map((m) => m[1]!);
}

/** the part names of the exported model, or null when the file is still a Git LFS pointer */
function modelParts(): Set<string> | null {
  const file = 'art/models/castle/paktwacht.glb';
  if (!existsSync(file)) return null;
  const buf = readFileSync(file);
  if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546c67) return null;
  const length = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + length).toString('utf8')) as { nodes?: Array<{ name?: string }> };
  const parts = new Set<string>();
  for (const n of json.nodes ?? []) {
    const hit = /^([a-z]+)_(a|[0-9]+)(?:_primitive\d+)?$/.exec(n.name ?? '');
    if (hit) parts.add(`${hit[1]}_${hit[2]}`);
  }
  return parts;
}

const castleRooms = Object.values(data.rooms)
  .filter((r) => r.homes.includes('castle'))
  .map((r) => r.id);

describe('castle model (story 10.14)', () => {
  it('builds and places exactly the keepsakes the content knows', () => {
    expect(keepsakeBuilders().sort()).toEqual([...CASTLE_PLACES].sort());
    const placed = layoutPlaces();
    for (const id of CASTLE_PLACES) expect(placed, `place of ${id}`).toContain(id);
  });

  it('names a place for every companion and no place twice', () => {
    const chars = Object.values(data.chars).filter((ch) => !ch.flags.includes('avatar') && !ch.flags.includes('lord'));
    const missing = chars.filter((ch) => !ch.homeObject || !CASTLE_PLACES.includes(ch.homeObject)).map((ch) => ch.id);
    expect(missing).toEqual([]);
    const used = chars.map((ch) => ch.homeObject!);
    expect(new Set(used).size).toBe(used.length);
  });

  it('has the castle rooms in its layout', () => {
    const placed = layoutPlaces();
    for (const id of castleRooms) expect(placed, `place of room ${id}`).toContain(id);
  });

  it('exports a part for every keepsake, every room level and the outwork of tier 3', () => {
    const parts = modelParts();
    if (!parts) return; // fresh checkout without `git lfs pull`
    for (const id of CASTLE_PLACES) expect(parts, `${id}_a`).toContain(`${id}_a`);
    for (const id of castleRooms) {
      expect(parts, `${id}_a`).toContain(`${id}_a`);
      // level 1 scaffolding, level 2 roof and windows, level 3 banners and life: every level shows a part of its own
      for (const level of [1, 2, 3]) {
        const shown = [...parts].some((p) => {
          const hit = /^([a-z]+)_([0-9]+)$/.exec(p);
          return hit?.[1] === id && hit[2]!.includes(String(level));
        });
        expect(shown, `${id} has a part for level ${level}`).toBe(true);
      }
    }
    // walls, keep and land per castle tier, the outwork at the foot of the pass among them (F4)
    for (const tier of [0, 1, 2, 3]) {
      const shown = [...parts].some((p) => {
        const hit = /^(shell|land)_([0-9]+)$/.exec(p);
        return hit && hit[2]!.includes(String(tier));
      });
      expect(shown, `tier ${tier} has a part`).toBe(true);
    }
    expect(parts).toContain('shell_3');
  });
});
