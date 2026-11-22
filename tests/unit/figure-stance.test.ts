/** Story 16.10: ModelFigure stance (rest, gestures, ready, switch in both directions, book swap) on a synthetic baked model. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { ModelFigure } from '../../src/render/shared/figures';
import type { UnitModel } from '../../src/render/shared/models';
import type { VatClip } from '../../src/render/shared/vat';

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

/** rows per clip at 4 fps: idle 16, rest 16 (4 s), gestures 8 (2 s), ready 16, ready_in 4 (1 s at 4 fps, the figure drives it by progress), walk 8 */
const SPEC: [string, number, boolean][] = [
  ['idle', 16, true], ['walk', 8, true], ['downed', 4, false],
  ['rest_blade', 16, true], ['ready_blade', 16, true], ['ready_in_blade', 5, false],
  ['gesture_blade_look', 8, false], ['gesture_blade_shift', 8, false], ['gesture_blade_regrip', 8, false],
];

function build(withBook = false) {
  const clips = new Map<string, VatClip>();
  let first = 0;
  for (const [name, rows, loop] of SPEC) {
    clips.set(name, { name, first, rows, loop, fps: 4 });
    first += rows;
  }
  const params = { x: 0, y: 0 };
  const closed = new TransformNode('closed', scene);
  const open = new TransformNode('open', scene);
  open.setEnabled(false);
  const model = {
    root: new TransformNode('unit:u1:player', scene),
    meshes: [],
    groups: [],
    skeletons: [],
    anims: {},
    book: withBook ? { closed: [closed], open: [open] } : undefined,
    vat: { entry: { data: { clips, sockets: [] }, sockets: new Float32Array(0) }, manager: { animationParameters: params }, sockets: [] },
    dispose: () => undefined,
  } as unknown as UnitModel;
  const f = new ModelFigure(model, undefined, 10, 4, { key: 'blade', switchS: 0.25, gestureEveryS: [6, 10] });
  return { f, clips, params, closed, open };
}

const inClip = (c: VatClip, row: number) => row >= c.first && row < c.first + c.rows;

describe('model figure stance (story 16.10)', () => {
  it('rests in rest_<key> and plays a gesture within 12 seconds, then returns to rest', () => {
    const { f, clips, params } = build();
    f.play('idle', 's', 1);
    const seen = new Set<string>();
    for (let t = 0; t <= 40000; t += 50) {
      f.tick(t);
      for (const [n, c] of clips) if (inClip(c, params.x)) seen.add(n);
    }
    expect(seen.has('rest_blade')).toBe(true);
    expect([...seen].filter((n) => n.startsWith('gesture_blade_')).length).toBeGreaterThan(0);
    expect(seen.has('idle')).toBe(false);
    expect(seen.has('ready_blade')).toBe(false);
  });

  it('switches to ready through ready_in in the switch time, and back backwards', () => {
    const { f, clips, params } = build();
    f.play('idle', 's', 1);
    f.tick(1000);
    f.setStance(true);
    f.tick(1125);
    const rin = clips.get('ready_in_blade')!;
    expect(inClip(rin, params.x)).toBe(true);
    expect(params.x).toBeGreaterThan(rin.first);
    expect(params.x).toBeLessThan(rin.first + rin.rows - 1);
    f.tick(1300);
    expect(inClip(clips.get('ready_blade')!, params.x)).toBe(true);
    f.setStance(false);
    f.tick(1300);
    f.tick(1425);
    expect(inClip(rin, params.x)).toBe(true);
    f.tick(1600);
    expect(inClip(clips.get('rest_blade')!, params.x)).toBe(true);
  });

  it('turns round in the middle of the switch from where it is', () => {
    const { f, clips, params } = build();
    f.play('idle', 's', 1);
    f.tick(100);
    f.setStance(true);
    f.tick(225);
    const mid = params.x;
    f.setStance(false);
    f.tick(225);
    expect(params.x).toBe(mid);
    f.tick(300);
    expect(params.x).toBeLessThan(mid);
    f.tick(500);
    expect(inClip(clips.get('rest_blade')!, params.x)).toBe(true);
  });

  it('walks unchanged and returns into the current stance; a downed figure stays downed', () => {
    const { f, clips, params } = build();
    f.play('idle', 's', 1);
    f.tick(0);
    f.setStance(true);
    f.tick(500);
    f.play('walk', 'e', 1);
    f.tick(600);
    expect(inClip(clips.get('walk')!, params.x)).toBe(true);
    f.setStance(false);
    f.setStance(true);
    f.play('idle', 's', 1);
    f.tick(700);
    f.tick(800);
    expect(inClip(clips.get('ready_blade')!, params.x)).toBe(true);
    f.play('downed', 's', 1);
    f.setStance(false);
    f.tick(900);
    f.tick(2000);
    expect(inClip(clips.get('downed')!, params.x)).toBe(true);
  });

  it('swaps a book between its closed and open model', () => {
    const { f, closed, open } = build(true);
    f.setStance(true);
    expect(closed.isEnabled()).toBe(false);
    expect(open.isEnabled()).toBe(true);
    f.setStance(false);
    expect(closed.isEnabled()).toBe(true);
    expect(open.isEnabled()).toBe(false);
  });
});
