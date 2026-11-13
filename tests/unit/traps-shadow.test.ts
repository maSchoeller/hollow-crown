/** Story 10.5: Fallensteller und Schatten – traps, the enemy's view, the hidden shadow; worker, replay and "Runde neu" alike. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  autoCommand,
  availableActions,
  enemyView,
  replayBattle,
  restartKeep,
  shadowHidden,
  threatMap,
  trapsOf,
  type BattleState,
  type BattleUnit,
  type Command,
  type GameData,
  type GameEvent,
  type Pos,
} from '../../src/core';
import { handleRequest } from '../../src/worker/handle';
import type { WorkerRequest, WorkerResponse } from '../../src/worker/protocol';
import { arena, place } from '../fixtures/arena';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

function field(): BattleState {
  const s = arena(data);
  s.locked = [];
  s.phase = 'player';
  return s;
}

/** A corridor along row y between x0 and x1: walls above and below, so every walk along it is the straight one. */
function corridor(s: BattleState, y: number, x0: number, x1: number): void {
  for (let x = x0; x <= x1; x++) for (const yy of [y - 1, y + 1]) s.terrain[yy * s.width + x] = 'wall';
}

const unitOf = (s: BattleState, uid: string): BattleUnit => s.units.find((u) => u.uid === uid)!;
const act = (u: BattleUnit, kind: 'trap' | 'disarm', at: Pos): Command => ({ type: 'act', unit: u.uid, to: u.pos!, action: { kind, at } });
/** The same unit acts again in a test (a new round without the enemy phase). */
const ready = (s: BattleState, uid: string): void => {
  const u = unitOf(s, uid);
  u.acted = false;
  u.moved = false;
};

/** Runs `fn` with fog switched on for the arena's map; the shared content is put back afterwards. */
function withFog<T>(s: BattleState, fn: () => T): T {
  const map = data.maps[s.mapId]!;
  const was = map.fog;
  map.fog = true;
  try {
    return fn();
  } finally {
    map.fog = was;
  }
}

function foe(s: BattleState, at: Pos, cls = 'brigand', weapon = 'iron_axe'): BattleUnit {
  const f = place(data, s, 'enemy', cls, at, weapon);
  f.ai = { profile: 'aggressive' };
  return f;
}

describe('content (story 10.5)', () => {
  it('shadow and trapper are playable with their pro skills, keep the scout role and have profiles', () => {
    expect(data.classes.shadow).toMatchObject({ playable: true, proSkills: ['pro_shadow'], role: 'scout', skill: 'climber' });
    expect(data.classes.trapper).toMatchObject({ playable: true, proSkills: ['pro_traps'], role: 'scout', skill: 'climber' });
    expect(data.skills.pro_shadow!.effect.hidden).toBe(true);
    expect(data.skills.pro_traps!.effect.grantAction).toBe('trap');
    expect(data.balance.classActions.trap).toEqual({ range: 1, max: 2, damage: 8, status: 'slowed' });
    expect(data.balance.shadow.revealDistance).toBe(3);
  });
});

describe('traps', () => {
  it('a trapper lays a trap on a free neighbouring field; the action is spent', () => {
    const s = field();
    const t = place(data, s, 'player', 'trapper', [5, 5], 'iron_dagger');
    place(data, s, 'player', 'captain', [5, 6]);
    s.terrain[4 * s.width + 5] = 'wall';
    const opt = availableActions(data, s, t, t.pos!).find((o) => o.kind === 'trap');
    // the wall above and the ally below are no fields for a trap
    expect(opt?.tiles).toEqual([
      [4, 5],
      [6, 5],
    ]);
    const r = applyCommand(data, s, act(t, 'trap', [6, 5]));
    expect(trapsOf(r.state)).toEqual([{ id: 'trap1', at: [6, 5], owner: t.uid, source: 'class', seq: 1 }]);
    expect(r.events).toContainEqual({ t: 'trapSet', unit: t.uid, trap: 'trap1', at: [6, 5] });
    expect(unitOf(r.state, t.uid).acted).toBe(true);
    expect(() => applyCommand(data, field(), act(place(data, field(), 'player', 'scout', [5, 5]), 'trap', [6, 5]))).toThrow();
  });

  it('a third trap replaces the oldest', () => {
    let s = field();
    const t = place(data, s, 'player', 'trapper', [5, 5], 'iron_dagger');
    const events: GameEvent[] = [];
    for (const at of [[4, 5], [6, 5], [5, 4]] as Pos[]) {
      const r = applyCommand(data, s, act(unitOf(s, t.uid), 'trap', at));
      s = r.state;
      events.push(...r.events);
      ready(s, t.uid);
    }
    expect(trapsOf(s).map((x) => x.at)).toEqual([
      [6, 5],
      [5, 4],
    ]);
    expect(events).toContainEqual({ t: 'trapRemoved', trap: 'trap1', at: [4, 5], unit: t.uid });
  });

  it('a foe walks into it: its move ends there, 8 damage without randomness, slowed, the trap is gone', () => {
    let s = field();
    corridor(s, 5, 4, 12);
    const t = place(data, s, 'player', 'trapper', [4, 5], 'iron_dagger');
    const f = foe(s, [9, 5]);
    f.hp = 30;
    s = applyCommand(data, s, act(t, 'trap', [5, 5])).state;
    // a second trap closer to the foe, laid in another round
    ready(s, t.uid);
    s.traps = [...trapsOf(s), { id: 'trap9', at: [7, 5], owner: t.uid, source: 'class', seq: 9 }];
    const r = applyCommand(data, s, { type: 'endPhase' });
    const after = unitOf(r.state, f.uid);
    expect(after.pos).toEqual([7, 5]);
    expect(after.hp).toBe(22);
    expect(after.status.map((x) => x.id)).toContain('slowed');
    expect(trapsOf(r.state).map((x) => x.id)).toEqual(['trap1']);
    expect(r.events).toContainEqual({ t: 'trapTriggered', trap: 'trap9', unit: f.uid, damage: 8, at: [7, 5] });
    // it decides anew from the trap without moving on: nobody in reach, so it waits
    expect(r.events.some((e) => e.t === 'strike')).toBe(false);
  });

  it('a foe stopped on a trap still strikes when a target is in reach from there', () => {
    let s = field();
    corridor(s, 5, 4, 12);
    const t = place(data, s, 'player', 'trapper', [5, 5], 'iron_dagger');
    const f = foe(s, [9, 5]);
    f.hp = 30;
    s = applyCommand(data, s, act(t, 'trap', [6, 5])).state;
    const r = applyCommand(data, s, { type: 'endPhase' });
    expect(unitOf(r.state, f.uid).pos).toEqual([6, 5]);
    expect(r.events.some((e) => e.t === 'strike' && e.attacker === f.uid)).toBe(true);
  });

  it('own and allied units walk over traps', () => {
    const s = field();
    corridor(s, 5, 3, 10);
    const t = place(data, s, 'player', 'trapper', [1, 1], 'iron_dagger');
    const runner = place(data, s, 'player', 'captain', [3, 5]);
    s.traps = [{ id: 'trap1', at: [5, 5], owner: t.uid, source: 'class', seq: 1 }];
    const r = applyCommand(data, s, { type: 'move', unit: runner.uid, to: [7, 5] });
    expect(unitOf(r.state, runner.uid).pos).toEqual([7, 5]);
    expect(trapsOf(r.state)).toHaveLength(1);
    expect(r.events.some((e) => e.t === 'trapTriggered')).toBe(false);
  });

  it('the trapper takes an own trap next to it back; the action is spent', () => {
    let s = field();
    const t = place(data, s, 'player', 'trapper', [5, 5], 'iron_dagger');
    s = applyCommand(data, s, act(t, 'trap', [6, 5])).state;
    ready(s, t.uid);
    expect(availableActions(data, s, unitOf(s, t.uid), [5, 5]).find((o) => o.kind === 'disarm')?.tiles).toEqual([[6, 5]]);
    const r = applyCommand(data, s, act(unitOf(s, t.uid), 'disarm', [6, 5]));
    expect(trapsOf(r.state)).toEqual([]);
    expect(r.events).toContainEqual({ t: 'trapRemoved', trap: 'trap1', at: [6, 5], unit: t.uid });
    expect(unitOf(r.state, t.uid).acted).toBe(true);
  });

  it('the enemy view leaves the traps of its foes out', () => {
    const s = field();
    const t = place(data, s, 'player', 'trapper', [5, 5]);
    const f = foe(s, [9, 5]);
    s.traps = [{ id: 'trap1', at: [6, 5], owner: t.uid, source: 'class', seq: 1 }];
    expect(trapsOf(enemyView(data, s, f.uid))).toEqual([]);
    expect(trapsOf(enemyView(data, s, t.uid))).toHaveLength(1);
  });
});

describe('the shadow', () => {
  it('is hidden on a fog map even with a foe next to it, and the foe does not strike it', () => {
    const s = field();
    const sh = place(data, s, 'player', 'shadow', [5, 5], 'iron_dagger');
    const f = foe(s, [6, 5]);
    withFog(s, () => {
      expect(shadowHidden(data, s, sh)).toBe(true);
      expect(enemyView(data, s, f.uid).units.some((u) => u.uid === sh.uid)).toBe(false);
      const r = applyCommand(data, s, { type: 'endPhase' });
      expect(unitOf(r.state, sh.uid).hp).toBe(sh.hp);
      expect(r.events.some((e) => e.t === 'strike')).toBe(false);
    });
  });

  it('without fog it is seen once a foe stands at distance 2 or less', () => {
    const s = field();
    const sh = place(data, s, 'player', 'shadow', [5, 5], 'iron_dagger');
    const f = foe(s, [8, 5]);
    expect(shadowHidden(data, s, sh)).toBe(true);
    f.pos = [7, 5];
    expect(shadowHidden(data, s, sh)).toBe(false);
    // a plain scout never hides
    expect(shadowHidden(data, s, place(data, s, 'player', 'scout', [1, 1]))).toBe(false);
  });

  it('after its own attack it is seen until the end of the next foe phase', () => {
    let s = field();
    const sh = place(data, s, 'player', 'shadow', [5, 5], 'iron_dagger');
    const f = foe(s, [6, 5]);
    f.hp = 60;
    withFog(s, () => {
      s = applyCommand(data, s, { type: 'act', unit: sh.uid, to: [5, 5], action: { kind: 'attack', target: f.uid } }).state;
      expect(unitOf(s, sh.uid).revealedUntil).toBe(s.turn);
      expect(shadowHidden(data, s, unitOf(s, sh.uid))).toBe(false);
      const r = applyCommand(data, s, { type: 'endPhase' });
      // the foe saw it and struck back in its phase; in the new round it is hidden again
      expect(r.events.some((e) => e.t === 'strike' && e.attacker === f.uid)).toBe(true);
      expect(shadowHidden(data, r.state, unitOf(r.state, sh.uid))).toBe(true);
    });
  });

  it('a counter does not reveal it', () => {
    const s = field();
    const sh = place(data, s, 'player', 'shadow', [5, 5], 'iron_dagger');
    sh.hp = 60;
    foe(s, [6, 5]);
    const r = applyCommand(data, s, { type: 'endPhase' });
    expect(r.events.some((e) => e.t === 'strike' && e.attacker === sh.uid)).toBe(true);
    expect(unitOf(r.state, sh.uid).revealedUntil ?? null).toBeNull();
  });

  it('a foe whose way leads over the hidden shadow stops on the last free field before it, without noticing', () => {
    const s = field();
    corridor(s, 5, 3, 12);
    const target = place(data, s, 'player', 'captain', [4, 5]);
    const sh = place(data, s, 'player', 'shadow', [7, 5]);
    const f = foe(s, [10, 5]);
    withFog(s, () => {
      const r = applyCommand(data, s, { type: 'endPhase' });
      expect(unitOf(r.state, f.uid).pos).toEqual([8, 5]);
      expect(r.events.some((e) => e.t === 'ambush')).toBe(false);
      expect(unitOf(r.state, sh.uid).hp).toBe(sh.hp);
      expect(unitOf(r.state, target.uid).hp).toBe(target.hp);
    });
  });

  it('the danger zone counts the foes on the board they see', () => {
    const s = field();
    corridor(s, 5, 3, 12);
    place(data, s, 'player', 'shadow', [7, 5]);
    foe(s, [10, 5]);
    withFog(s, () => {
      // past the hidden shadow the foe reaches the fields behind it
      expect(threatMap(data, s, 'player').byTile.has('5,5')).toBe(true);
    });
  });
});

describe('determinism', () => {
  function scene(): { start: BattleState; log: Command[] } {
    const s = field();
    corridor(s, 5, 2, 12);
    const t = place(data, s, 'player', 'trapper', [3, 5], 'iron_dagger');
    const sh = place(data, s, 'player', 'shadow', [5, 5], 'iron_dagger');
    const f = foe(s, [10, 5]);
    f.hp = 40;
    // a trap in front of the trapper; the hidden shadow stands in the foe's way
    const log: Command[] = [
      { type: 'act', unit: t.uid, to: [3, 5], action: { kind: 'trap', at: [4, 5] } },
      { type: 'act', unit: sh.uid, to: [5, 5], action: { kind: 'wait' } },
      { type: 'endPhase' },
      { type: 'endPhase' },
    ];
    return { start: s, log };
  }

  it('worker and synchronous fallback, replay and "Runde neu" give the same state', () => {
    const { start, log } = scene();
    let s = start;
    const sync: GameEvent[] = [];
    for (const c of log) {
      const r = applyCommand(data, s, c);
      s = r.state;
      sync.push(...r.events);
    }
    // through the worker protocol (structured clone both ways)
    let w = start;
    const viaWorker: GameEvent[] = [];
    let id = 1;
    for (const c of log) {
      if (c.type === 'endPhase') {
        const req: WorkerRequest = structuredClone({ id: id++, kind: 'apply', packs: [], state: w, command: c });
        const res: WorkerResponse = structuredClone(handleRequest(data, req));
        if (!res.ok) throw new Error(res.error);
        w = res.state;
        viaWorker.push(...res.events);
      } else {
        const r = applyCommand(data, w, c);
        w = r.state;
        viaWorker.push(...r.events);
      }
    }
    expect(w).toEqual(s);
    expect(viaWorker).toEqual(sync);
    expect(replayBattle(data, start, log)).toEqual(s);
    // "Runde neu": back to the start of the round, then the same commands again
    const keep = restartKeep('turn', log);
    const again = replayBattle(data, replayBattle(data, start, log.slice(0, keep)), log.slice(keep));
    expect(again).toEqual(replayBattle(data, start, log));
  });

  it('autoplay lets a trapper with nothing to strike lay a trap next to it, closest to the nearest foe', () => {
    const s = field();
    const t = place(data, s, 'player', 'trapper', [5, 5], 'iron_dagger');
    t.flags = [];
    foe(s, [12, 5]).ai = { profile: 'hold' };
    const cmd = autoCommand(data, s);
    expect(cmd.type).toBe('act');
    if (cmd.type !== 'act') return;
    expect(cmd.action.kind).toBe('trap');
    if (cmd.action.kind !== 'trap') return;
    const to = cmd.to;
    expect(Math.abs(cmd.action.at[0] - to[0]) + Math.abs(cmd.action.at[1] - to[1])).toBe(1);
    expect(cmd.action.at[0]).toBeGreaterThanOrEqual(to[0]);
  });
});
