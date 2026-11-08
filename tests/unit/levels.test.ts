/** Height levels, connectors, closed gates and `set_terrain` (GDD, decision of 2026-11-04) on the probe map `dev_levels`. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { beforeAll, describe, expect, it } from 'vitest';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { loadContentFromDisk } from '../../src/content/node';
import { mapSchema } from '../../src/content/schemaMap';
import { validateContent } from '../../src/content/validate';
import {
  applyCommand,
  attackTargets,
  autoplay,
  canStrike,
  createBattle,
  dangerZone,
  threatTiles,
  tileThreats,
  forecast,
  levelAt,
  newCampaign,
  posKey,
  reachable,
  samePos,
  startBattle,
  strikeTiles,
  walkPath,
  type BattleState,
  type GameData,
  type MapDef,
  type Pos,
} from '../../src/core';
import { figureAt } from '../../src/render/board/picking';
import { connectorRot, gatePieces, topPieces } from '../../src/render/board/wallKit';

let data: GameData;
let locales: ReturnType<typeof loadContentFromDisk>['locales'];

function start(): BattleState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = startBattle(data, createBattle(data, c, 'dev_levels', [])).state;
  s.lockedRoles = [];
  return s;
}

const unit = (s: BattleState, uid: string) => s.units.find((u) => u.uid === uid)!;
const place = (s: BattleState, uid: string, at: Pos) => {
  unit(s, uid).pos = at;
};
/** The company off the board except the unit under test, so nothing blocks a tile. */
function alone(s: BattleState, ...keep: string[]) {
  for (const u of s.units) if (!keep.includes(u.uid) && u.uid !== 'dev_yard_guard') u.pos = u.id === 'dev_vanguard' ? [0, 11] : null;
}

/** The class of a move type: a copy of the scout's, so only the way of moving differs. */
function classOf(moveType: 'foot' | 'armored' | 'mounted' | 'flier' | 'monster'): string {
  const id = `test_${moveType}`;
  data.classes[id] = { ...data.classes.scout!, id, moveType };
  return id;
}

/** Lets a unit fly: its own class with the flier's way of moving, so its weapons stay usable. */
function fly(u: BattleState['units'][number]) {
  const id = `test_flying_${u.classId}`;
  data.classes[id] = { ...data.classes[u.classId]!, id, moveType: 'flier' };
  u.classId = id;
}

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
  const raw = parse(readFileSync(join(process.cwd(), 'tests', 'fixtures', 'maps', 'dev_levels.yaml'), 'utf8'));
  data.maps.dev_levels = { ...mapSchema.parse(raw), act: 1 } as MapDef;
  const first = data.acts[1]!.nodes[0]!;
  data.acts[1]! = { ...data.acts[1]!, nodes: [...data.acts[1]!.nodes, { ...first, id: 'dev_levels', map: 'dev_levels', pre: undefined, post: undefined }] };
});

describe('levels of the map', () => {
  it('reads terrain levels and map overrides', () => {
    const s = start();
    expect(levelAt(data, s, [0, 8])).toBe(0);
    expect(levelAt(data, s, [0, 5])).toBe(1); // wall walk
    expect(levelAt(data, s, [13, 5])).toBe(2); // tower
    expect(levelAt(data, s, [12, 5])).toBe(1); // stairs a map raised
  });

  it('the probe map passes the content check', () => {
    expect(validateContent(data, locales).filter((i) => i.file.includes('dev_levels'))).toEqual([]);
  });

  it('a connector without exactly one higher neighbour fails the check', () => {
    const bad = { ...data.maps.dev_levels!, levels: [] };
    const d = { ...data, maps: { ...data.maps, dev_levels: bad } };
    expect(validateContent(d, locales).map((i) => i.message).join()).toContain('stairs at 12,5');
  });

  it('a ladder must lean against a tile one level up, and no map may still use the old ladder tile (fix 2026-11-08)', () => {
    const check = (patch: Partial<MapDef>) => {
      const d = { ...data, maps: { ...data.maps, dev_levels: { ...data.maps.dev_levels!, ...patch } } };
      return validateContent(d, locales)
        .filter((i) => i.file.includes('dev_levels'))
        .map((i) => i.message)
        .join();
    };
    expect(check({ ladders: [{ at: [12, 7], up: 'e' }] })).toContain('ladder at 12,7 up e: needs the tile above one level higher');
    expect(check({ ladders: [{ at: [0, 11], up: 's' }] })).toContain('off the map');
    expect(check({ ladders: [{ at: [12, 7], up: 'n' }, { at: [12, 7], up: 'n' }] })).toContain('listed twice');
    expect(check({ legend: { ...data.maps.dev_levels!.legend, l: 'ladder' } })).toContain("legend 'l': terrain ladder is legacy");
  });
});

describe('moving between levels', () => {
  it('nobody climbs a wall without a connector', () => {
    const s = start();
    alone(s, 'dev_scout');
    place(s, 'dev_scout', [5, 7]);
    const reach = reachable(data, s, unit(s, 'dev_scout'), undefined, 1);
    expect(reach.has(posKey([5, 6]))).toBe(false);
    expect(walkPath(data, s, unit(s, 'dev_scout'), [[5, 7], [5, 6]], 5)).toBeNull();
  });

  it('a ramp carries everyone, also mounted units', () => {
    const s = start();
    alone(s, 'dev_scout');
    const u = unit(s, 'dev_scout');
    place(s, 'dev_scout', [2, 7]);
    for (const moveType of ['foot', 'armored', 'mounted', 'monster'] as const) {
      u.classId = classOf(moveType);
      expect(reachable(data, s, u, undefined, 5).has(posKey([2, 6]))).toBe(true);
    }
  });

  it('stairs bar mounted units, a ladder everyone but those on foot', () => {
    const s = start();
    alone(s, 'dev_scout');
    const u = unit(s, 'dev_scout');
    place(s, 'dev_scout', [10, 8]);
    u.classId = classOf('mounted');
    expect(reachable(data, s, u, undefined, 9).has(posKey([10, 7]))).toBe(false);
    u.classId = classOf('foot');
    expect(reachable(data, s, u, undefined, 9).has(posKey([10, 6]))).toBe(true);
    place(s, 'dev_scout', [12, 8]);
    // the ladder leans against the wall walk: foot [12,7], plain grass; the climb costs `elevation.climb` on top (fix 2026-11-08)
    expect(reachable(data, s, u, undefined, 3).has(posKey([12, 6]))).toBe(true);
    expect(reachable(data, s, u, undefined, 2).has(posKey([12, 6]))).toBe(false);
    u.classId = classOf('armored');
    expect(reachable(data, s, u, undefined, 3).has(posKey([12, 6]))).toBe(false); // the ramp far west would carry it
    // but everyone stands on and passes the tile in front of it
    expect(reachable(data, s, u, undefined, 1).has(posKey([12, 7]))).toBe(true);
    place(s, 'dev_scout', [11, 7]);
    expect(reachable(data, s, u, undefined, 2).get(posKey([13, 7]))?.prev).toBe(posKey([12, 7]));
  });

  it('a climb down a ladder costs the same as up, and only the edge it leans against is a way', () => {
    const s = start();
    alone(s, 'dev_scout');
    const u = unit(s, 'dev_scout');
    u.classId = classOf('foot');
    place(s, 'dev_scout', [12, 6]);
    const down = reachable(data, s, u, undefined, 9);
    expect(down.get(posKey([12, 7]))?.cost).toBe(1 + data.balance.elevation.climb.foot!);
    // the wall walk beside it has no ladder: no way down there
    place(s, 'dev_scout', [11, 6]);
    expect(reachable(data, s, u, undefined, 1).has(posKey([11, 7]))).toBe(false);
  });

  it('fliers need no connector, but two levels stay out of reach of anyone else', () => {
    const s = start();
    alone(s, 'dev_scout');
    const u = unit(s, 'dev_scout');
    place(s, 'dev_scout', [13, 7]);
    expect(reachable(data, s, u, undefined, 4).has(posKey([13, 6]))).toBe(false);
    place(s, 'dev_scout', [11, 5]);
    expect(reachable(data, s, u, undefined, 1).has(posKey([12, 5]))).toBe(true);
    expect(reachable(data, s, u, undefined, 2).has(posKey([13, 5]))).toBe(true); // up the raised stairs
    u.classId = classOf('flier');
    place(s, 'dev_scout', [5, 7]);
    expect(reachable(data, s, u, undefined, 1).has(posKey([5, 6]))).toBe(true);
  });
});

describe('striking across levels', () => {
  it('a ranged weapon reaches one further from above, not from below', () => {
    const s = start();
    expect(canStrike(data, s, unit(s, 'dev_vanguard'), [3, 5], [3, 8], [2, 2])).toBe(true);
    expect(canStrike(data, s, unit(s, 'dev_vanguard'), [3, 8], [3, 5], [2, 2])).toBe(false);
    expect(canStrike(data, s, unit(s, 'dev_vanguard'), [3, 5], [3, 9], [2, 2])).toBe(false);
    expect(canStrike(data, s, unit(s, 'dev_vanguard'), [0, 8], [3, 8], [2, 2])).toBe(false); // on the same level the range stays
  });

  it('a melee weapon gains nothing from above', () => {
    const s = start();
    expect(canStrike(data, s, unit(s, 'dev_vanguard'), [3, 6], [3, 8], [1, 1])).toBe(false);
  });

  it('a blow lands on the same level or across a ramp or stairs, not across a wall or ladder', () => {
    const s = start();
    expect(canStrike(data, s, unit(s, 'dev_vanguard'), [0, 8], [0, 9], [1, 1])).toBe(true);
    expect(canStrike(data, s, unit(s, 'dev_vanguard'), [5, 7], [5, 6], [1, 1])).toBe(false); // wall
    expect(canStrike(data, s, unit(s, 'dev_vanguard'), [2, 7], [2, 6], [1, 1])).toBe(true); // ramp
    expect(canStrike(data, s, unit(s, 'dev_vanguard'), [2, 6], [2, 7], [1, 1])).toBe(true);
    expect(canStrike(data, s, unit(s, 'dev_vanguard'), [10, 7], [10, 6], [1, 1])).toBe(true); // stairs
    expect(canStrike(data, s, unit(s, 'dev_vanguard'), [12, 7], [12, 6], [1, 1])).toBe(false); // ladder
    expect(canStrike(data, s, unit(s, 'dev_vanguard'), [12, 6], [13, 6], [1, 1])).toBe(false); // wall walk beside the tower
  });

  it('the attack list, the forecast and the threat zone follow the same rule', () => {
    const s = start();
    alone(s, 'dev_marksman', 'dev_wall_archer', 'dev_vanguard');
    place(s, 'dev_marksman', [3, 8]);
    const archer = unit(s, 'dev_wall_archer');
    const below = unit(s, 'dev_marksman');
    // the archer on the wall walk hits the marksman at 3 tiles; the marksman cannot answer from below
    const targets = attackTargets(data, s, archer, [3, 5]);
    expect(targets[below.uid]).toBeTruthy();
    const f = forecast(data, s, archer.uid, below.uid, targets[below.uid]![0]!, [3, 5]);
    expect(f.defender.canStrike).toBe(false);
    expect(attackTargets(data, s, below, [3, 8])[archer.uid]).toBeUndefined();
    expect(strikeTiles(data, s, archer, [3, 5], [2, 2]).some((p) => p[0] === 3 && p[1] === 8)).toBe(true);
    expect(dangerZone(data, s, 'player', [archer.uid]).has(posKey([3, 8]))).toBe(true);
  });

  it('a counter across a wall does not happen', () => {
    const s = start();
    alone(s, 'dev_marksman', 'dev_wall_guard', 'dev_vanguard');
    place(s, 'dev_marksman', [9, 8]);
    place(s, 'dev_wall_guard', [9, 6]);
    const shooter = unit(s, 'dev_marksman');
    const w = attackTargets(data, s, shooter, [9, 8])['dev_wall_guard'];
    expect(w).toBeTruthy();
    expect(forecast(data, s, shooter.uid, 'dev_wall_guard', w![0]!, [9, 8]).defender.canStrike).toBe(false);
  });
});

describe('no level rule for a blow in a fight with a flier', () => {
  it('a blow of a flier lands across a wall, a ladder and two levels; the others stay bound', () => {
    const s = start();
    const flier = unit(s, 'dev_vanguard');
    fly(flier);
    expect(canStrike(data, s, flier, [5, 7], [5, 6], [1, 1])).toBe(true); // wall
    expect(canStrike(data, s, flier, [5, 6], [5, 7], [1, 1])).toBe(true); // down from it
    expect(canStrike(data, s, flier, [12, 7], [12, 6], [1, 1])).toBe(true); // ladder
    expect(levelAt(data, s, [13, 6]) - levelAt(data, s, [13, 7])).toBe(2);
    expect(canStrike(data, s, flier, [13, 7], [13, 6], [1, 1])).toBe(true);
    const foot = unit(s, 'dev_marksman');
    expect(canStrike(data, s, foot, [5, 7], [5, 6], [1, 1])).toBe(false);
    expect(canStrike(data, s, foot, [13, 7], [13, 6], [1, 1])).toBe(false);
  });

  it('flying changes no reach: a melee weapon stays at one tile, a bow gets no bonus from below', () => {
    const s = start();
    const flier = unit(s, 'dev_vanguard');
    fly(flier);
    expect(canStrike(data, s, flier, [3, 6], [3, 8], [1, 1])).toBe(false);
    expect(canStrike(data, s, flier, [3, 8], [3, 5], [2, 2])).toBe(false);
    expect(canStrike(data, s, flier, [3, 5], [3, 8], [2, 2])).toBe(true); // from above as for anyone
  });

  it('attack list, forecast and threat zone follow the same rule; a foe on foot answers a flier and strikes it', () => {
    const s = start();
    alone(s, 'dev_vanguard', 'dev_wall_guard');
    const flier = unit(s, 'dev_vanguard');
    const guard = unit(s, 'dev_wall_guard');
    place(s, 'dev_vanguard', [5, 7]);
    place(s, 'dev_wall_guard', [5, 6]);
    expect(attackTargets(data, s, flier, [5, 7])[guard.uid]).toBeUndefined();
    expect(threatTiles(data, s, flier, true).has(posKey([5, 6]))).toBe(false);
    fly(flier);
    const weapons = attackTargets(data, s, flier, [5, 7])[guard.uid];
    expect(weapons).toBeTruthy();
    expect(threatTiles(data, s, flier, true).has(posKey([5, 6]))).toBe(true);
    expect(forecast(data, s, flier.uid, guard.uid, weapons![0]!, [5, 7]).defender.canStrike).toBe(true);
    const back = attackTargets(data, s, guard, [5, 6])[flier.uid];
    expect(back).toBeTruthy();
    expect(forecast(data, s, guard.uid, flier.uid, back![0]!, [5, 6]).defender.canStrike).toBe(true);
    expect(threatTiles(data, s, guard, true).has(posKey([5, 7]))).toBe(true);
  });

  it('who walks stays bound against who walks; a tile a flier might step onto counts for it alone', () => {
    const s = start();
    alone(s, 'dev_vanguard', 'dev_wall_guard', 'dev_marksman');
    const guard = unit(s, 'dev_wall_guard');
    const flier = unit(s, 'dev_vanguard');
    place(s, 'dev_wall_guard', [5, 6]);
    place(s, 'dev_marksman', [5, 7]);
    place(s, 'dev_vanguard', [0, 11]);
    fly(flier);
    expect(attackTargets(data, s, guard, [5, 6])['dev_marksman']).toBeUndefined();
    expect(canStrike(data, s, guard, [5, 6], [4, 6], [1, 1])).toBe(true); // same level
    place(s, 'dev_marksman', [0, 10]);
    expect(threatTiles(data, s, guard, true).has(posKey([5, 7]))).toBe(false);
    expect(threatTiles(data, s, guard, true, flier).has(posKey([5, 7]))).toBe(true);
    expect(tileThreats(data, s, flier, [5, 7])).toContain('dev_wall_guard');
    expect(canStrike(data, s, guard, [5, 6], [5, 7], [1, 1], flier)).toBe(true);
    expect(canStrike(data, s, guard, [3, 5], [3, 8], [1, 1], flier)).toBe(false); // the reach stays
  });

  it('a flier answers a flier across the wall', () => {
    const s = start();
    alone(s, 'dev_vanguard', 'dev_wall_guard');
    place(s, 'dev_vanguard', [5, 7]);
    place(s, 'dev_wall_guard', [5, 6]);
    fly(unit(s, 'dev_vanguard'));
    fly(unit(s, 'dev_wall_guard'));
    const weapons = attackTargets(data, s, unit(s, 'dev_vanguard'), [5, 7])['dev_wall_guard'];
    expect(forecast(data, s, 'dev_vanguard', 'dev_wall_guard', weapons![0]!, [5, 7]).defender.canStrike).toBe(true);
  });

  it('the AI finds the target of a flier, also straight across the wall', () => {
    const s = start();
    alone(s, 'dev_vanguard', 'dev_wall_guard');
    place(s, 'dev_vanguard', [5, 7]);
    place(s, 'dev_wall_guard', [5, 6]);
    fly(unit(s, 'dev_wall_guard'));
    const r = applyCommand(data, s, { type: 'endPhase' });
    expect(r.events.some((e) => e.t === 'combat' && e.attacker === 'dev_wall_guard' && e.defender === 'dev_vanguard')).toBe(true);
  });

  it('a foe on foot on the wall strikes a flier below it without coming down', () => {
    const s = start();
    alone(s, 'dev_vanguard', 'dev_wall_guard');
    place(s, 'dev_vanguard', [5, 7]);
    place(s, 'dev_wall_guard', [5, 6]);
    fly(unit(s, 'dev_vanguard'));
    const r = applyCommand(data, s, { type: 'endPhase' });
    expect(r.events.some((e) => e.t === 'combat' && e.attacker === 'dev_wall_guard' && e.defender === 'dev_vanguard')).toBe(true);
    expect(unit(r.state, 'dev_wall_guard').pos).toEqual([5, 6]);
  });
});

describe('closed gates, levers and set_terrain', () => {
  it('a closed gate blocks; the lever opens both wings and stays down', () => {
    const s = start();
    alone(s, 'dev_scout', 'dev_vanguard');
    place(s, 'dev_scout', [6, 5]);
    expect(reachable(data, s, unit(s, 'dev_scout'), undefined, 3).has(posKey([6, 4]))).toBe(false);
    place(s, 'dev_scout', [7, 10]);
    const r = applyCommand(data, s, { type: 'act', unit: 'dev_scout', to: [7, 10], action: { kind: 'lever', object: 'dev_lever' } });
    expect(r.state.terrain[4 * r.state.width + 6]).toBe('gate');
    expect(r.state.terrain[4 * r.state.width + 7]).toBe('gate');
    expect(r.state.objects.find((o) => o.id === 'dev_lever')!.state).toBe('open');
    expect(r.state.objects.find((o) => o.id === 'dev_gate_e')!.state).toBe('open');
  });

  it('a wall falls by set_terrain and takes its level along; the replay is the same', () => {
    const s = start();
    alone(s, 'dev_vanguard');
    const run = (b: BattleState) => {
      let cur = b;
      while (cur.turn < 4 && !cur.outcome) cur = applyCommand(data, cur, { type: 'endPhase' }).state;
      return cur;
    };
    const after = run(s);
    expect(after.turn).toBe(4);
    expect(after.terrain[5 * after.width + 9]).toBe('ruins');
    expect(levelAt(data, after, [9, 5])).toBe(0);
    expect(after).toEqual(run(s));
  });

  it('an event leaves a tile alone while a unit stands there that could not stand on the new terrain', () => {
    const s = start();
    alone(s, 'dev_vanguard', 'dev_scout');
    place(s, 'dev_scout', [9, 3]);
    const map = data.maps.dev_levels!;
    const trigger = { id: 'shut', when: { type: 'turn_start', turn: 2, phase: 'player' }, then: [{ action: 'set_terrain', area: { tiles: [[9, 3], [8, 3]] }, terrain: 'gate_closed' }] } as MapDef['triggers'][number];
    data.maps.dev_levels = { ...map, triggers: [trigger] };
    let cur = s;
    while (cur.turn < 2) cur = applyCommand(data, cur, { type: 'endPhase' }).state;
    data.maps.dev_levels = map;
    expect(cur.terrain[3 * cur.width + 9]).toBe('plain');
    expect(cur.terrain[3 * cur.width + 8]).toBe('gate_closed');
  });
});

describe('the AI on levels', () => {
  it('a melee foe on the wall walk comes down the stairs, the battle plays to its end, the replay is the same', () => {
    const s = start();
    const guard = unit(s, 'dev_wall_guard');
    const r = autoplay(data, s, 3000);
    expect(r.state.outcome).not.toBeNull();
    expect(guard.pos).toEqual([8, 5]); // the start state is untouched
    const again = autoplay(data, s, 3000);
    expect(again.state).toEqual(r.state);
  });

  it('with the gate the only way, the company opens it: the lever first, a scout needs no key', () => {
    const map = data.maps.dev_levels!;
    data.maps.dev_levels = { ...map, triggers: [] };
    const s = start();
    place(s, 'dev_yard_guard', [11, 1]); // out of a shot from the wall walk, so only the gate reaches it
    const end = autoplay(data, s, 3000).state;
    data.maps.dev_levels = map;
    expect(end.outcome).toBe('victory');
    expect(end.objects.filter((o) => o.id.startsWith('dev_gate')).every((o) => o.state === 'open')).toBe(true);
  });

  it('the distance field of a melee foe leads over the connector, not through the wall', () => {
    const s = start();
    alone(s, 'dev_wall_guard', 'dev_vanguard');
    place(s, 'dev_vanguard', [8, 8]);
    let cur = s;
    for (let i = 0; i < 2; i++) cur = applyCommand(data, cur, { type: 'endPhase' }).state;
    const moved = unit(cur, 'dev_wall_guard');
    // it stood on the wall walk at (8,5): it goes east to the stairs at (10,7), it cannot drop down beside the vanguard
    expect(moved.pos![0]).toBeGreaterThanOrEqual(8);
    expect(levelAt(data, cur, moved.pos!) === 1 || samePos(moved.pos, [10, 7]) || moved.pos![1] >= 7).toBe(true);
  });
});

describe('board kit and picking on levels', () => {
  const rows = ['.=.', '.s.', '...'];
  const ids: Record<string, string> = { '=': 'rampart', s: 'stairs', '.': 'plain' };
  const at = (x: number, y: number) => (rows[y]?.[x] ? ids[rows[y]![x]!]! : null);

  it('a connector turns towards the higher neighbour', () => {
    const h = (x: number, y: number) => (at(x, y) === 'rampart' ? 0.85 : 0);
    expect(connectorRot(h, 1, 1)).toBe(Math.PI);
  });

  it('a wall walk has parapets on free edges, none towards its stairs', () => {
    expect(topPieces(at, 1, 0).map((p) => p.rot)).not.toContain(Math.PI);
    expect(topPieces(at, 1, 0).length).toBe(3);
  });

  it('closed wings pair into the closed gatehouse', () => {
    const g = (x: number, y: number) => (y === 0 && (x === 0 || x === 1) ? 'gate_closed' : 'plain');
    expect(gatePieces(g, 0, 0)[0]!.model).toBe('gatehouse_closed');
    expect(gatePieces(g, 1, 0)).toEqual([]);
  });

  it('a tap at the body of a figure on a wall walk finds its tile', () => {
    // 35 degrees from the vertical: the plane of the screen rises to the north
    const tilt = (35 * Math.PI) / 180;
    const up = new Vector3(0, Math.sin(tilt), Math.cos(tilt));
    const feet = new Vector3(3.5, 0.85, -5.5);
    const fig = [{ tile: [3, 5] as Pos, top: 0.85 }];
    expect(figureAt(feet.add(up.scale(0.4)), up, fig)).toEqual([3, 5]);
    expect(figureAt(feet.add(up.scale(1.2)), up, fig)).toBeNull();
    expect(figureAt(feet.add(new Vector3(0.6, 0, 0)), up, fig)).toBeNull();
    const front = [...fig, { tile: [3, 6] as Pos, top: 0 }];
    expect(figureAt(new Vector3(3.5, 0, -6.5).add(up.scale(0.3)), up, front)).toEqual([3, 6]);
  });
});
