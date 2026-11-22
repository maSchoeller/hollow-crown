/**
 * Story 16.6: the rune weapon files (art/models/weapons-v2) and rune stone files (art/models/runes-v2) as the board expects
 * them (src/render/shared/runeGlow.ts), read from the glb JSON: nodes and meshes, `fill` on UV1, triangle budgets, one stone
 * per rune of content/core/runes.yaml, the groups' render.yaml entries. Files in Git LFS are pointers in a bare checkout: skipped.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { pieceFolder } from '../../src/core';
import { fixedRuneOf, modelFor } from '../../src/render/shared/gearModel';

const { data } = loadContentFromDisk();
const WEAPONS = 'art/models/weapons-v2';
const STONES = 'art/models/runes-v2';
const WEAPON_BUDGET = 8500;
const STONE_BUDGET = 2000;

interface Gltf {
  nodes: Array<{ name?: string; mesh?: number; scale?: number[] }>;
  meshes: Array<{ name?: string; primitives: Array<{ attributes: Record<string, number>; indices?: number }> }>;
  accessors: Array<{ count: number }>;
}

const isGlb = (f: string) => existsSync(f) && readFileSync(f).readUInt32LE(0) === 0x46546c67;
const files = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.glb')).map((f) => `${dir}/${f}`) : []);

function read(f: string): Gltf {
  const b = readFileSync(f);
  return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8')) as Gltf;
}

function triangles(g: Gltf, mesh: number): number {
  return g.meshes[mesh]!.primitives.reduce((n, p) => n + g.accessors[p.indices ?? p.attributes.POSITION!]!.count / 3, 0);
}

const total = (g: Gltf) => g.nodes.reduce((n, nd) => n + (nd.mesh === undefined ? 0 : triangles(g, nd.mesh)), 0);
const named = (g: Gltf, re: RegExp) => g.nodes.filter((n) => re.test(n.name ?? ''));

const weaponFiles = files(WEAPONS);
const stoneFiles = files(STONES);
const present = (list: string[]) => list.length > 0 && list.every(isGlb);

describe('rune weapon files', () => {
  const maybe = present(weaponFiles) ? it : it.skip;

  it('are the models render.yaml points every group at (and nothing points at the old library)', () => {
    const { weapons, offHand } = data.render.gear;
    const pieces = [...Object.values(weapons), ...Object.values(offHand)];
    expect(pieces.length).toBeGreaterThanOrEqual(11);
    for (const p of pieces) expect(pieceFolder(p)).toBe('weapons-v2');
    if (present(weaponFiles)) {
      for (const p of pieces) {
        expect(weaponFiles, `${p.model}`).toContain(`${WEAPONS}/${p.model}.glb`);
        if (p.modelOpen) expect(weaponFiles, `${p.modelOpen}`).toContain(`${WEAPONS}/${p.modelOpen}.glb`);
      }
      // every file is used
      const used = new Set(pieces.flatMap((p) => [p.model, p.modelOpen ?? p.model]));
      for (const f of weaponFiles) expect(used.has(f.slice(WEAPONS.length + 1, -4)), f).toBe(true);
    }
    expect(data.render.gear.offHand.focus?.hand).toBe('left');
    expect(weapons.anima!.modelOpen).toBe('book_open');
  });

  it('nothing references the old library models/weapons/ (render.yaml, plan, build, first download)', () => {
    for (const f of ['content/core/render.yaml', 'src/app/loading/plan.ts', 'tools/art/build.py', 'tools/build/first-mission.mjs', 'tools/art/silhouettes.py']) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/models\/weapons\//);
    }
    expect(existsSync('art/models/weapons')).toBe(false);
    expect(existsSync('tools/art/blender_weapons.py')).toBe(false);
  });

  maybe('hold the metal, the channel with its fill on UV1 and stay within the triangle budget', () => {
    for (const f of weaponFiles) {
      const g = read(f);
      const id = f.slice(WEAPONS.length + 1, -4);
      const node = (name: string) => g.nodes.find((n) => n.name === name);
      expect(node(id), `${id}: metal mesh`).toBeDefined();
      const channel = node('rune_channel');
      expect(channel, `${id}: rune_channel`).toBeDefined();
      expect(Object.keys(g.meshes[channel!.mesh!]!.primitives[0]!.attributes), `${id}: fill`).toContain('TEXCOORD_1');
      expect(total(g), `${id}: triangles`).toBeLessThanOrEqual(WEAPON_BUDGET);
      expect(total(g), `${id}: triangles`).toBeGreaterThan(0);
    }
  });

  // depends on the rebuilt models: the placeholder `rune_stone` goes, the setting nodes come
  maybe('have the main setting node(s), the small setting node and its mesh; the placeholder stone is gone', () => {
    for (const f of weaponFiles) {
      const g = read(f);
      const id = f.slice(WEAPONS.length + 1, -4);
      const a = named(g, /^socket_rune_a/);
      expect(a.length, `${id}: socket_rune_a*`).toBeGreaterThanOrEqual(1);
      expect(a.length, `${id}: socket_rune_a*`).toBeLessThanOrEqual(2);
      for (const n of a) expect(n.mesh, `${id}: ${n.name} is an empty node`).toBeUndefined();
      const b = named(g, /^socket_rune_b/).length;
      expect(b, `${id}: socket_rune_b`).toBeGreaterThanOrEqual(1);
      expect(b, `${id}: socket_rune_b`).toBeLessThanOrEqual(2);
      expect(named(g, /^rune_socket2/).length, `${id}: rune_socket2`).toBe(1);
      expect(named(g, /^rune_stone/).length, `${id}: placeholder rune_stone`).toBe(0);
    }
  });
});

/** Story 16.8: the signature weapons and relics (art/models/weapons-v2/sig/<itemId>.glb, `render.yaml` `gear.items`, fixed runes on the items). */
describe('signature piece files', () => {
  const SIG = `${WEAPONS}/sig`;
  const sigFiles = files(SIG);
  const maybe = present(sigFiles) ? it : it.skip;
  const SIGNATURES = ['tinder', 'bounty', 'wolf_fang', 'little_hands', 'rowenas_lance', 'wasp_sting', 'gold_hook', 'dravns_oath', 'magpie', 'white_wolf', 'heirloom', 'final_curtain', 'pact_warden_shield', 'dragon_ember'];

  it('every signature weapon and relic has an entry in gear.items and a fixed rune; every entry is an item with a sig/ model', () => {
    const entries = data.render.gear.items;
    expect(Object.keys(entries).sort()).toEqual([...SIGNATURES].sort());
    for (const id of SIGNATURES) {
      expect(data.items[id], `${id}: item`).toBeDefined();
      expect(entries[id]!.model, id).toBe(`sig/${id}`);
      const fixed = [data.items[id]!.fixedRune ?? []].flat();
      expect(fixed.length, `${id}: fixedRune`).toBeGreaterThan(0);
      for (const r of fixed) expect(data.runes[r], `${id}: rune ${r}`).toBeDefined();
      if (present(sigFiles)) expect(sigFiles, id).toContain(`${SIG}/${id}.glb`);
    }
    expect([data.items.pact_warden_shield!.fixedRune, data.items.dragon_ember!.fixedRune].map((f) => [f].flat().length)).toEqual([3, 2]);
  });

  it('resolve to the same piece for the board and the screens (one source), with the hand of the group', () => {
    const gear = data.render.gear;
    expect(modelFor(data.items.bounty!, gear)).toEqual({ ...gear.weapons.bow, model: 'sig/bounty' });
    expect(modelFor(data.items.final_curtain!, gear)).toEqual({ ...gear.offHand.lute, model: 'sig/final_curtain' });
    expect(modelFor(data.items.iron_sword!, gear)).toBe(gear.weapons.sword);
    expect(modelFor(data.items.dragon_ember!, gear)?.model).toBe('sig/dragon_ember');
    expect(fixedRuneOf(data.items.pact_warden_shield!, 1)).toBe('earth_rune_1');
    expect(fixedRuneOf(data.items.pact_warden_shield!, 3)).toBe('earth_rune_3');
    expect(fixedRuneOf(data.items.dragon_ember!, 3)).toBe('fire_rune_2');
    expect(fixedRuneOf(data.items.iron_sword!)).toBeUndefined();
  });

  maybe('hold the metal mesh, the channel with its fill on UV1, the setting nodes and stay within the triangle budget', () => {
    for (const f of sigFiles) {
      const g = read(f);
      const id = f.slice(SIG.length + 1, -4);
      const channel = g.nodes.find((n) => n.name === 'rune_channel');
      expect(channel, `${id}: rune_channel`).toBeDefined();
      expect(Object.keys(g.meshes[channel!.mesh!]!.primitives[0]!.attributes), `${id}: fill`).toContain('TEXCOORD_1');
      expect(total(g), `${id}: triangles`).toBeLessThanOrEqual(WEAPON_BUDGET);
      expect(total(g), `${id}: triangles`).toBeGreaterThan(0);
      expect(named(g, /^socket_rune_a/).length, `${id}: socket_rune_a*`).toBeGreaterThanOrEqual(1);
      expect(named(g, /^rune_stone/).length, `${id}: placeholder rune_stone`).toBe(0);
      if (id !== 'dragon_ember') {
        expect(named(g, /^socket_rune_b/).length, `${id}: socket_rune_b`).toBeGreaterThanOrEqual(1);
        expect(named(g, /^rune_socket2/).length, `${id}: rune_socket2`).toBe(1);
      }
    }
  });
});

describe('rune stone files', () => {
  const maybe = present(stoneFiles) ? it : it.skip;

  maybe('are one per rune of runes.yaml, with their parts and under the triangle budget', () => {
    expect(stoneFiles.map((f) => f.slice(STONES.length + 1, -4)).sort()).toEqual(Object.keys(data.runes).sort());
    for (const f of stoneFiles) {
      const g = read(f);
      const id = f.slice(STONES.length + 1, -4);
      expect(named(g, /^rune_stone/).length, `${id}: rune_stone`).toBe(1);
      expect(named(g, /^rune_symbol/).length, `${id}: rune_symbol`).toBe(1);
      const tier3 = data.runes[id]!.tier === 3;
      expect(named(g, /^rune_gold/).length, `${id}: rune_gold`).toBe(tier3 ? 1 : 0);
      expect(named(g, /^rune_core/).length, `${id}: rune_core`).toBe(tier3 ? 1 : 0);
      expect(total(g), `${id}: triangles`).toBeLessThan(STONE_BUDGET);
    }
  });
});

describe('metals of the items', () => {
  it('name iron and steel on the prefixed items of the bow and dagger groups', () => {
    expect(['iron_bow', 'steel_bow', 'iron_dagger', 'steel_dagger'].map((id) => data.items[id]!.metal)).toEqual(['iron', 'steel', 'iron', 'steel']);
  });
  it('name iron and steel on the existing weapon and shield items of the four groups', () => {
    const metals = Object.fromEntries(['iron_sword', 'steel_sword', 'iron_lance', 'steel_lance', 'iron_axe', 'steel_axe', 'iron_shield'].map((id) => [id, data.items[id]!.metal]));
    expect(metals).toEqual({ iron_sword: 'iron', steel_sword: 'steel', iron_lance: 'iron', steel_lance: 'steel', iron_axe: 'iron', steel_axe: 'steel', iron_shield: 'iron' });
  });
});
