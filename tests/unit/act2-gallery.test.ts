// Story 11.24: gallery models of act 2 – rope bridge and quay kits, 2 × 2 and turned hand-placed variants, the maps that use them.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { parsePacks } from '../../src/content/packs';
import { unshippedGalleryModels, validatePropVariants } from '../../src/content/validateLook';
import { FACE_ROT, quayPiece, ropeBridgePiece } from '../../src/render/board/wallKit';
import type { MapDef } from '../../src/core/mapDefs';

const { data } = loadContentFromDisk();
const S = Math.PI;
const E = Math.PI / 2;
const N = 0;
const W = -Math.PI / 2;

/** a small grid from rows of chars: the predicate reads the char at (x, y), outside the rows nothing */
const at = (rows: string[], ch: string) => (x: number, y: number) => rows[y]?.[x] === ch;
const land = (rows: string[]) => at(rows, '.');

describe('rope bridge kit', () => {
  it('anchors a north-south span on both banks and runs straight between', () => {
    const rows = ['.', 'r', 'r', 'r', '.'];
    const bridge = at(rows, 'r');
    expect(ropeBridgePiece(bridge, land(rows), 0, 1)).toEqual({ model: 'rope_bridge_end', rot: S });
    expect(ropeBridgePiece(bridge, land(rows), 0, 2)).toEqual({ model: 'rope_bridge_straight', rot: S });
    expect(ropeBridgePiece(bridge, land(rows), 0, 3)).toEqual({ model: 'rope_bridge_end', rot: N });
  });
  it('turns an east-west span, and a cut span keeps its anchors (2-5, round 6)', () => {
    const row = ['.rrr.'];
    const bridge = at(row, 'r');
    expect(ropeBridgePiece(bridge, land(row), 1, 0)).toEqual({ model: 'rope_bridge_end', rot: E });
    expect(ropeBridgePiece(bridge, land(row), 2, 0)).toEqual({ model: 'rope_bridge_straight', rot: E });
    expect(ropeBridgePiece(bridge, land(row), 3, 0)).toEqual({ model: 'rope_bridge_end', rot: W });
    const rows = ['.', 'r', '~', '~', 'r', '.'];
    expect(ropeBridgePiece(at(rows, 'r'), land(rows), 0, 1)).toEqual({ model: 'rope_bridge_end', rot: S });
    expect(ropeBridgePiece(at(rows, 'r'), land(rows), 0, 4)).toEqual({ model: 'rope_bridge_end', rot: N });
  });
});

describe('quay kit', () => {
  it('faces its stone edge to the water and turns a corner where two water sides meet', () => {
    const rows = ['~~~~', '~qq~', '~~~~'];
    const water = at(rows, '~');
    // the west end has water west and south (and north): more than two sides, so the edge faces south
    expect(quayPiece(water, 1, 1)).toEqual({ model: 'quay_straight', rot: S });
    const row = at(['....', 'qqq~', '~~~~'], '~');
    expect(quayPiece(row, 0, 1)).toEqual({ model: 'quay_straight', rot: S });
    expect(quayPiece(row, 2, 1)).toEqual({ model: 'quay_corner', rot: S });
    const north = at(['~~~', 'qqq', '...'], '~');
    expect(quayPiece(north, 1, 1)).toEqual({ model: 'quay_straight', rot: N });
    const ne = at(['~~~', 'q.~', '...'], '~');
    expect(quayPiece(at(['..~~', '..q~', '....'], '~'), 2, 1)).toEqual({ model: 'quay_corner', rot: E });
    expect(quayPiece(ne, 0, 1)).toEqual({ model: 'quay_straight', rot: N });
    expect(quayPiece(at(['~..', '~q.', '~~.'], '~'), 1, 1)).toEqual({ model: 'quay_corner', rot: W });
    expect(quayPiece(at(['...', '.q.', '...'], '~'), 1, 1)).toEqual({ model: 'quay_straight', rot: S });
  });
  it('a face turns the front (south side as built) to that side', () => {
    expect(FACE_ROT).toEqual({ south: S, east: E, north: N, west: W });
  });
});

describe('content:check rules for wide and 2 × 2 variants', () => {
  const m25 = data.maps.m2_5_silberquell!;
  const withVariants = (propVariants: MapDef['propVariants']) => ({ ...data, maps: { m: { ...m25, id: 'm', propVariants } } });
  it('a 2 × 2 model needs the same terrain on its east, south and south-east neighbours, without models of their own', () => {
    expect(validatePropVariants(withVariants([{ at: [12, 16], model: 'monastery_a' }]))).toEqual([]);
    // [13,17] is the corner of the block: no room to the east and south
    expect(validatePropVariants(withVariants([{ at: [13, 17], model: 'monastery_a' }])).map((i) => i.message)).toEqual([expect.stringContaining('2 × 2')]);
    expect(validatePropVariants(withVariants([{ at: [12, 16], model: 'monastery_a' }, { at: [13, 17], model: 'house_slate_a' }])).map((i) => i.message)).toEqual([
      expect.stringContaining('2 × 2'),
    ]);
  });
  it('a waterfall is a rock variant placed by hand, turned by `face`', () => {
    expect(m25.propVariants).toContainEqual({ at: [19, 10], model: 'waterfall_a', face: 'west' });
    expect(data.render.board.variants.rock.find((v) => v.model === 'waterfall_a')?.weight).toBe(0);
  });
});

describe('act 2 maps draw the gallery models (story 11.24)', () => {
  const legendAt = (id: string, x: number, y: number) => {
    const m = data.maps[id]!;
    return m.legend[m.terrain.split(/\r?\n/).filter((r) => r.length > 0)[y]![x]!];
  };
  it('2-5 crosses the gorge on rope bridges, 2-7 lines both banks with quays, N5 lights its walls with torches', () => {
    for (const y of [9, 10, 11, 12]) for (const x of [4, 15]) expect(legendAt('m2_5_silberquell', x, y)).toBe('rope_bridge');
    for (const x of [1, 8, 11, 17]) expect(legendAt('m2_7_kontor', x, 11)).toBe('quay');
    for (const x of [1, 8, 11, 15, 17, 18]) expect(legendAt('m2_7_kontor', x, 15)).toBe('quay');
    expect(legendAt('m2_7_kontor', 16, 15)).toBe('lever');
    expect(['n5_kupfermine'].flatMap(() => [[4, 1], [11, 1], [3, 12], [13, 11], [5, 17], [10, 17]].map(([x, y]) => legendAt('n5_kupfermine', x!, y!)))).toEqual(Array(6).fill('torch'));
  });
  it('the new terrains keep the values of the ones they replace', () => {
    const rules = (id: string) => {
      const { id: _id, prop: _prop, ...rest } = data.terrain[id]!;
      return rest;
    };
    expect(rules('rope_bridge')).toEqual(rules('footbridge'));
    const { ground: _g, surface: _s, ...quay } = rules('quay');
    const { ground: _pg, surface: _ps, ...plain } = rules('plain');
    expect(quay).toEqual(plain);
  });
  it('every model a map of act 2 sets by hand ships and comes with a later pack, never in the first download', () => {
    const groupsDir = join(process.cwd(), 'concept', '23-art-direction', 'map-assets', 'groups');
    const unshipped = unshippedGalleryModels(readdirSync(groupsDir).filter((f) => f.endsWith('.yaml')).map((f) => parse(readFileSync(join(groupsDir, f), 'utf8')) as unknown));
    const packs = parsePacks(parse(readFileSync(join(process.cwd(), 'content', 'packs.yaml'), 'utf8')));
    const later = new Set(packs.filter((p) => p.id !== 'core').flatMap((p) => p.props));
    const act2 = Object.values(data.maps).filter((m) => m.act === 2);
    const models = new Set(act2.flatMap((m) => (m.propVariants ?? []).map((p) => p.model)));
    expect(models.size).toBeGreaterThan(15);
    for (const model of models) {
      expect(unshipped.has(model), model).toBe(false);
      expect(later.has(model), model).toBe(true);
    }
    for (const kit of ['rope_bridge_straight', 'rope_bridge_end', 'quay_straight', 'quay_corner']) expect(packs.find((p) => p.id === 'act2')!.props).toContain(kit);
  });
});
