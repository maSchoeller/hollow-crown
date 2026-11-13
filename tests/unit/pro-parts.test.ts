/**
 * Story 10.13: the attached part of a pro path on the board. The mapping class → part → model and socket, the part
 * files `tools/art/blender_proparts.py` built (within `partBudget` of content/packs.yaml), which figure models carry
 * the body sockets, and the loading plan that fetches a part file with the mission.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { partBudgetSchema } from '../../src/content/packs';
// @ts-expect-error plain ES module of the build tooling, without type declarations
import { checkParts, readPartBudget } from '../../tools/figure-budget.mjs';
import { pieceFolder, socketName } from '../../src/core';
import { loadContentFromDisk } from '../../src/content/node';
import { missionAssets } from '../../src/app/loading/plan';

const { data } = loadContentFromDisk();
const { proParts } = data.render.gear;
const proClasses = Object.values(data.classes).filter((c) => c.tier === 'pro');

/** A file in Git LFS is only a pointer text in a fresh checkout; the model tests skip then (like tests/unit/vat.test.ts). */
const isGlb = (f: string) => existsSync(f) && readFileSync(f).readUInt32LE(0) === 0x46546c67;

describe('pro path parts', () => {
  it('gives every pro class exactly one part with a model and a body socket', () => {
    expect(proClasses).toHaveLength(16);
    const used = proClasses.map((c) => c.proPart);
    expect(new Set(used).size).toBe(proClasses.length);
    expect([...used].sort()).toEqual(Object.keys(proParts).sort());
    for (const c of proClasses) {
      const piece = proParts[c.proPart!]!;
      expect(piece.model).toBeTruthy();
      expect(['back', 'head']).toContain(piece.socket);
    }
  });

  it('hangs a part on a body socket and a weapon in a hand, each from its own model folder', () => {
    expect(socketName(proParts.tower_shield!)).toBe('socket_back');
    expect(socketName(proParts.mitre!)).toBe('socket_head');
    expect(pieceFolder(proParts.tower_shield!)).toBe('parts');
    expect(socketName(data.render.gear.weapons.sword!)).toBe('socket_r');
    expect(socketName(data.render.gear.weapons.bow!)).toBe('socket_l');
    expect(pieceFolder(data.render.gear.weapons.sword!)).toBe('weapons');
  });

  it('fetches the part model of a pro class with the mission, and nothing for a base class', () => {
    // generic units of both classes draw the `soldier` figure (`art` in classes.yaml), so one model covers both
    const base = { models: ['soldier'], classes: data.classes, gear: data.render.gear, defaultPlace: 'camp' };
    const parts = ['tower_shield'];
    const of = (classId: string, partModels?: readonly string[]) =>
      missionAssets({ units: [{ classId }], ...base, partModels }).filter((p) => p.startsWith('models/parts/'));
    expect(of('bulwark', parts)).toEqual(['models/parts/tower_shield.glb']);
    // without the part in the manifest (not built yet) nothing is fetched, and a base class has no part at all
    expect(of('bulwark')).toEqual([]);
    expect(of('vanguard', parts)).toEqual([]);
  });
});

/** The models `tools/art/blender_proparts.py` wrote; they live in Git LFS, so a checkout without them skips. */
describe('part model files', () => {
  const dir = 'art/models/parts';
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.glb')).map((f) => `${dir}/${f}`) : [];
  const present = files.length > 0 && files.every(isGlb);
  const maybe = present ? it : it.skip;

  maybe('has one file per part, inside partBudget and without a texture', () => {
    expect(files.map((f) => f.slice(dir.length + 1, -4)).sort()).toEqual(Object.values(proParts).map((p) => p.model).sort());
    const { rows, outliers } = checkParts(files, partBudgetSchema.parse(parse(readFileSync('content/packs.yaml', 'utf8')).partBudget)) as {
      rows: { id: string; triangles: number; why: string[] }[];
      outliers: { id: string; why: string[] }[];
    };
    expect(readPartBudget()).toMatchObject({ triangles: 600 });
    expect(outliers.map((r) => `${r.id}: ${r.why.join(', ')}`)).toEqual([]);
    for (const r of rows) expect(r.triangles).toBeGreaterThan(0);
  });
});

/**
 * Which figure models carry the body sockets: the image-to-3D figures do (`pnpm art:tripo`), the remaining Blender
 * figures do not and therefore show no part. The list is the record the story asks for; it fails only when a baked
 * file has fewer sockets than `prepare_tripo_unit.py` writes.
 */
describe('figures with body sockets', () => {
  const dir = 'art/models/units';
  const vats = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.vat')) : [];
  const glbs = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.glb')).map((f) => f.slice(0, -4)) : [];
  const present = vats.length > 0 && readFileSync(`${dir}/${vats[0]}`).subarray(0, 2).toString('hex') === '1f8b';
  const maybe = present ? it : it.skip;

  maybe('lists the figures without sockets and gives every baked figure all four', async () => {
    const { inflateVat, parseVat } = await import('../../src/render/shared/vat');
    const withSockets: string[] = [];
    for (const f of vats) {
      const buf = readFileSync(`${dir}/${f}`);
      const v = parseVat(await inflateVat(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
      expect(v.sockets.map((s) => s.name).sort(), f).toEqual(['socket_back', 'socket_head', 'socket_l', 'socket_r']);
      withSockets.push(f.slice(0, -4));
    }
    // the Blender figures (story 4.6 §4.6: kept until an image-to-3D figure replaces them) carry their weapon in the model
    const without = glbs.filter((id) => !withSockets.includes(id)).sort();
    expect(without).toEqual(['avatar', 'fighter', 'mage']);
  });
});
