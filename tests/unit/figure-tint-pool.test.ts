import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { loadContentFromDisk } from '../../src/content/node';
import { ModelFigure } from '../../src/render/shared/figures';
import { newFigureLook } from '../../src/render/shared/figurePlugin';
import { giveTint, takeTint, tintKey, type UnitModel } from '../../src/render/shared/models';
import { RingLayer } from '../../src/render/board/rings';

const { data } = loadContentFromDisk();
const look = newFigureLook(data.render.look);

let engine: NullEngine;
let scene: Scene;
beforeEach(() => {
  engine = new NullEngine();
  scene = new Scene(engine);
});
afterEach(() => {
  scene.dispose();
  engine.dispose();
});

describe('tint material pool (story 7.8)', () => {
  it('hands out one material per case and takes it back for the next hit', () => {
    const pool = new Map<string, StandardMaterial[]>();
    const flash = takeTint(pool, scene, look, null, false);
    const fade = takeTint(pool, scene, look, null, true);
    expect(flash).not.toBe(fade);
    expect(flash.transparencyMode).toBe(0);
    expect(fade.transparencyMode).toBe(2);
    expect(tintKey(null, false)).not.toBe(tintKey(null, true));
    giveTint(pool, null, false, flash, 2);
    expect(takeTint(pool, scene, look, null, false)).toBe(flash);
    // a second take finds the pool empty: a new material
    expect(takeTint(pool, scene, look, null, false)).not.toBe(flash);
  });

  it('keeps at most `max` per case and disposes the rest', () => {
    const pool = new Map<string, StandardMaterial[]>();
    const mats = [0, 1, 2].map(() => takeTint(pool, scene, look, null, false));
    const before = scene.materials.length;
    for (const m of mats) giveTint(pool, null, false, m, 2);
    expect(pool.get(tintKey(null, false))).toHaveLength(2);
    expect(scene.materials.length).toBe(before - 1);
  });
});

describe('model figure tint (story 7.8)', () => {
  function figure() {
    const root = new TransformNode('unit:u1:player', scene);
    const body = new Mesh('body', scene);
    const model = {
      root,
      meshes: [body],
      groups: [{ meshes: [body], texture: null }],
      shared: new Map<string, StandardMaterial>(),
      tintPool: new Map<string, StandardMaterial[]>(),
      look,
      skeletons: [],
      anims: {},
      grips: [],
      dispose: () => undefined,
    } as unknown as UnitModel;
    return { f: new ModelFigure(model, undefined, 10, 4), body, model };
  }

  it('wears the shared material at rest, a pooled one while it flashes, and gives it back', () => {
    const { f, body, model } = figure();
    f.tint(0, 0, 1);
    const rest = body.material as StandardMaterial;
    expect(model.shared.size).toBe(1);
    f.tint(0, 0.6, 1);
    const flash = body.material as StandardMaterial;
    expect(flash).not.toBe(rest);
    expect(flash.transparencyMode).toBe(0);
    expect(flash.emissiveColor.r).toBeCloseTo(0.48);
    f.tint(0, 0, 1);
    expect(body.material).toBe(rest);
    expect(model.tintPool.get(tintKey(null, false))).toEqual([flash]);
    // the next flash reuses it
    f.tint(0, 0.3, 1);
    expect(body.material).toBe(flash);
  });

  it('changes over from the opaque to the blended case when the fade starts', () => {
    const { f, body, model } = figure();
    f.tint(0, 0.5, 1);
    const flash = body.material as StandardMaterial;
    f.tint(0, 0.5, 0.5);
    const fade = body.material as StandardMaterial;
    expect(fade).not.toBe(flash);
    expect(fade.transparencyMode).toBe(2);
    expect(fade.alpha).toBe(0.5);
    expect(model.tintPool.get(tintKey(null, false))).toEqual([flash]);
    f.tint(0, 0, 1);
    expect(model.tintPool.get(tintKey(null, true))).toEqual([fade]);
  });

  it('applies the same tint only once', () => {
    const { f, body } = figure();
    f.tint(0, 0.5, 1);
    const m = body.material as StandardMaterial;
    m.emissiveColor.set(0, 0, 0);
    f.tint(0, 0.5, 1);
    expect(m.emissiveColor.r).toBe(0);
  });
});

describe('ring layer upload (story 7.8)', () => {
  it('writes a translation matrix per ring and a zero scale for a hidden one', () => {
    const rings = new RingLayer(scene, { player: '#336699', enemy: '#aa3333', other: '#999999' });
    rings.add('a', 'player');
    rings.add('b', 'player');
    rings.place('a', 3, 0.025, -4, 0.5);
    rings.place('b', 5, 0.025, -6, 0);
    rings.flush();
    const mesh = scene.getMeshByName('rings:player') as Mesh;
    const m = mesh.thinInstanceGetWorldMatrices();
    expect(m).toHaveLength(2);
    expect(m[0]!.m.slice(0, 16)).toEqual(Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 0.025, -4, 1]));
    expect([m[1]!.m[0], m[1]!.m[5], m[1]!.m[10], m[1]!.m[12], m[1]!.m[15]]).toEqual([0, 0, 0, 5, 1]);
  });
});
