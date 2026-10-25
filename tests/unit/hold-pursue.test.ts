/** Halten (Vorkämpfer) and Nachsetzen (Plänkler), story 2.4 (GDD Rollenklassen). Built on fixtures: an arena with units placed by the tests. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  beginBattle,
  bestApproach,
  computeStats,
  destinations,
  holdZone,
  moveBudget,
  newCampaign,
  newItem,
  passivePreview,
  posKey,
  pursueReach,
  reachable,
  reachNow,
  replayBattle,
  threatTiles,
  validate,
  type BattleState,
  type BattleUnit,
  type Command,
  type GameData,
  type Pos,
} from '../../src/core';

let data: GameData;

/** Prologue state with every unit removed from the map except the ones a test places itself, on an open field. */
function arena(): BattleState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  for (const u of s.units) u.pos = null;
  s.units.forEach((u) => (u.gone = 'retreated'));
  s.outcome = null;
  s.lockedRoles = [];
  s.terrain = s.terrain.map(() => 'plain'); // the tests do not depend on the map's terrain
  return s;
}

function place(s: BattleState, team: BattleUnit['team'], classId: string, at: Pos, weapon?: string): BattleUnit {
  const u = s.units.find((x) => x.gone === 'retreated' && x.pos === null && (team === 'player' ? x.team === 'player' : x.team === 'enemy'));
  if (!u) throw new Error('out of units');
  u.gone = undefined;
  u.pos = at;
  u.classId = classId;
  u.equip = {};
  u.bag = [];
  u.acted = false;
  u.moved = false;
  u.downed = false;
  u.status = [];
  u.buffs = [];
  u.usedPerMap = {};
  u.personalSkill = undefined;
  u.flags = [];
  u.ai = u.team === 'enemy' ? { profile: 'aggressive' } : undefined;
  u.hp = computeStats(data, u).maxHp;
  if (weapon) u.equip.mainHand = newItem(s, weapon, data);
  return u;
}

const act = (s: BattleState, cmd: Command) => applyCommand(data, s, cmd);
/** Nodes of a reach map that were reached by walking on from tile `k`. */
const viaTile = (reach: ReturnType<typeof reachable>, k: string) => [...reach.values()].filter((n) => n.prev === k);

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('Halten numbers', () => {
  it('has the detour limit of 2 in balance.yaml (GDD)', () => {
    expect(data.balance.classActions.hold).toEqual({ detourMax: 2 });
  });
});

describe('Halten (Vorkämpfer)', () => {
  // enemy vanguard at (6,5); the player's skirmisher walks along row 5 from the west
  function scene() {
    const s = arena();
    expect(s.width).toBeGreaterThanOrEqual(12);
    expect(s.height).toBeGreaterThanOrEqual(12);
    const foe = place(s, 'enemy', 'vanguard', [6, 5], 'iron_lance');
    const runner = place(s, 'player', 'skirmisher', [1, 5], 'iron_sword');
    return { s, foe, runner };
  }

  it('lists the neighbour tiles of every active hostile vanguard as hold zone', () => {
    const { s } = scene();
    expect([...holdZone(data, s, 'player')].sort()).toEqual(['5,5', '6,4', '6,6', '7,5']);
    expect([...holdZone(data, s, 'other')].sort()).toEqual(['5,5', '6,4', '6,6', '7,5']);
  });

  it("has no hold zone for the vanguard's own side", () => {
    const { s } = scene();
    expect(holdZone(data, s, 'enemy').size).toBe(0);
  });

  it('has no hold zone when the vanguard is downed, gone, or its role is still locked', () => {
    const { s, foe } = scene();
    s.lockedRoles = ['vanguard'];
    expect(holdZone(data, s, 'player').size).toBe(0);
    s.lockedRoles = [];
    foe.downed = true;
    expect(holdZone(data, s, 'player').size).toBe(0);
    foe.downed = false;
    foe.gone = 'dead';
    expect(holdZone(data, s, 'player').size).toBe(0);
  });

  it('also comes from the pro paths of the vanguard (bulwark, breaker)', () => {
    const { s, foe } = scene();
    for (const id of ['bulwark', 'breaker']) {
      foe.classId = id;
      expect(holdZone(data, s, 'player').size).toBe(4);
    }
  });

  it('stops a unit on the first hold tile: the tile is reachable at normal cost, nothing is explored behind it', () => {
    const { s, foe, runner } = scene();
    runner.pos = [3, 5];
    const reach = reachable(data, s, runner);
    expect(reach.get('5,5')?.cost).toBe(2);
    expect(viaTile(reach, '5,5')).toHaveLength(0);
    // (7,6) is only reachable through the hold tile (6,6) at MOV 5 and is cut off
    expect(reach.has('6,6')).toBe(true);
    expect(reach.has('7,6')).toBe(false);
    // control: the same foe without the vanguard role does not hold
    foe.classId = 'brigand';
    expect(reachable(data, s, runner).has('7,6')).toBe(true);
  });

  it('is one function for the player area, the danger zone and the AI', () => {
    const { s, runner } = scene();
    runner.pos = [3, 5];
    const dests = destinations(s, runner, reachable(data, s, runner)).map(posKey).sort();
    expect(destinations(s, runner, reachNow(data, s, runner)).map(posKey).sort()).toEqual(dests);
    expect(threatTiles(data, s, runner).has('5,5')).toBe(true);
  });

  it('works for both teams: a player vanguard stops enemy units', () => {
    const s = arena();
    place(s, 'player', 'vanguard', [6, 5], 'iron_lance');
    const brigand = place(s, 'enemy', 'brigand', [1, 5], 'iron_axe');
    const reach = reachable(data, s, brigand);
    expect(reach.has('5,5')).toBe(true);
    expect(viaTile(reach, '5,5')).toHaveLength(0);
  });

  it('gives full movement to a unit that starts on a hold tile; only entering counts', () => {
    const { s, runner } = scene();
    runner.pos = [5, 5];
    const reach = reachable(data, s, runner);
    const mov = moveBudget(data, s, runner);
    expect(reach.has(posKey([Math.max(0, 5 - mov), 5]))).toBe(true);
    // walking into the zone again at (6,4) stops there
    expect(reach.has('6,4')).toBe(true);
    expect(viaTile(reach, '6,4')).toHaveLength(0);
  });

  it('blocks passing through an occupied hold tile, and standing on it', () => {
    const { s, runner } = scene();
    place(s, 'player', 'vanguard', [5, 5], 'iron_lance');
    expect(reachable(data, s, runner).has('5,5')).toBe(false);
  });

  it('holds fliers too', () => {
    const { s, runner } = scene();
    runner.classId = 'pegasus_knight';
    runner.pos = [3, 5];
    const reach = reachable(data, s, runner);
    expect(reach.has('5,5')).toBe(true);
    expect(viaTile(reach, '5,5')).toHaveLength(0);
  });

  it('the move command ends on the hold tile and refuses tiles behind it', () => {
    const { s, runner } = scene();
    runner.pos = [3, 5];
    const r = act(s, { type: 'move', unit: runner.uid, to: [5, 5] });
    const ev = r.events.find((e) => e.t === 'moved');
    expect(ev && ev.t === 'moved' && ev.path.at(-1)).toEqual([5, 5]);
    expect(validate(data, s, { type: 'move', unit: runner.uid, to: [7, 6] })).toBe('unreachable');
  });
});

describe('KI-Pfadsuche und Haltezonen', () => {
  // enemy walker on the west, goal on the east, a player vanguard in between
  function field(vanguardAt: Pos, tweak?: (s: BattleState) => void) {
    const s = arena();
    place(s, 'player', 'vanguard', vanguardAt, 'iron_lance');
    const walker = place(s, 'enemy', 'brigand', [2, 5], 'iron_axe');
    tweak?.(s);
    return { s, walker };
  }
  const goal: Pos = [11, 5];

  it('goes round a hold zone when the detour costs at most 2 more', () => {
    // vanguard at (7,4): hold tile (7,5) lies on row 5; row 6 is a way round for +2
    const { s, walker } = field([7, 4]);
    walker.pos = [4, 5];
    const hold = holdZone(data, s, 'enemy');
    expect(hold.has('7,5')).toBe(true);
    const to = bestApproach(data, s, walker, [goal]);
    expect(to).not.toBeNull();
    expect(hold.has(posKey(to!))).toBe(false);
  });

  it('runs into the hold zone when the detour costs 3 more', () => {
    // forest on (7,6) makes the way round via row 6 cost 3 more
    const { s, walker } = field([7, 4], (st) => (st.terrain[6 * st.width + 7] = 'forest'));
    walker.pos = [4, 5];
    const hold = holdZone(data, s, 'enemy');
    const to = bestApproach(data, s, walker, [goal]);
    expect(to).not.toBeNull();
    expect(hold.has(posKey(to!))).toBe(true);
  });

  it('runs in when no way round exists at all (corridor)', () => {
    const { s, walker } = field([7, 5], (st) => {
      for (let y = 0; y < st.height; y++) for (let x = 0; x < st.width; x++) if (y < 4 || y > 6) st.terrain[y * st.width + x] = 'wall';
    });
    walker.pos = [4, 5];
    const to = bestApproach(data, s, walker, [goal]);
    expect(to && posKey(to)).toBe('6,5');
  });

  it('without a vanguard the approach is unchanged: straight along the row', () => {
    const { s, walker } = field([7, 4]);
    walker.pos = [4, 5];
    s.units.find((u) => u.team === 'player' && u.pos)!.classId = 'brigand';
    const to = bestApproach(data, s, walker, [goal]);
    expect(to && to[1]).toBe(5);
  });
});

describe('Nachsetzen (Plänkler)', () => {
  function scene() {
    const s = arena();
    const skirm = place(s, 'player', 'skirmisher', [3, 5], 'iron_sword');
    const foe = place(s, 'enemy', 'brigand', [5, 5], 'iron_axe');
    foe.hp = 200; // survives
    const mate = place(s, 'player', 'vanguard', [1, 1], 'iron_lance');
    return { s, skirm, foe, mate };
  }
  const attack = (skirm: BattleUnit, foe: BattleUnit, to: Pos = [4, 5]): Command => ({ type: 'act', unit: skirm.uid, to, action: { kind: 'attack', target: foe.uid } });

  it('opens after an attack with the remaining movement: MOV minus the cost walked', () => {
    const { s, skirm, foe } = scene();
    const total = moveBudget(data, s, skirm);
    const r = act(s, attack(skirm, foe));
    expect(r.state.pursue).toEqual({ unit: skirm.uid, left: total - 1 });
  });

  it('opens after an attack from the spot, with the full MOV as rest', () => {
    const { s, skirm, foe } = scene();
    skirm.pos = [4, 5];
    const r = act(s, attack(skirm, foe));
    expect(r.state.pursue).toEqual({ unit: skirm.uid, left: moveBudget(data, s, skirm) });
  });

  it('counts a move command done earlier in the phase', () => {
    const { s, skirm, foe } = scene();
    const total = moveBudget(data, s, skirm);
    const walked = act(s, { type: 'move', unit: skirm.uid, to: [4, 5] }).state;
    const r = act(walked, attack(skirm, foe));
    expect(r.state.pursue).toEqual({ unit: skirm.uid, left: total - 1 });
  });

  it('counts buffs such as Anfeuern in the rest', () => {
    const { s, skirm, foe } = scene();
    const plain = moveBudget(data, s, skirm);
    skirm.buffs.push({ source: 'cheer', mov: 1, hit: 10, untilTurn: s.turn, untilPhase: 'player' });
    const r = act(s, attack(skirm, foe));
    expect(r.state.pursue?.left).toBe(plain);
  });

  it('opens even if the target falls', () => {
    const { s, skirm, foe } = scene();
    foe.hp = 1;
    place(s, 'enemy', 'brigand', [10, 10], 'iron_axe'); // the battle goes on
    const r = act(s, attack(skirm, foe));
    const t = r.state.units.find((u) => u.uid === foe.uid)!;
    expect(t.downed || !!t.gone).toBe(true);
    expect(r.state.pursue?.unit).toBe(skirm.uid);
  });

  it('opens only after attack, only for skirmishers', () => {
    const { s, skirm, foe } = scene();
    expect(act(s, { type: 'act', unit: skirm.uid, to: [4, 5], action: { kind: 'wait' } }).state.pursue).toBeUndefined();
    skirm.classId = 'vanguard';
    skirm.equip = { mainHand: newItem(s, 'iron_lance', data) };
    expect(act(s, attack(skirm, foe)).state.pursue).toBeUndefined();
  });

  it('does not open for a skirmisher that is downed by the counter', () => {
    const { s, skirm, foe } = scene();
    skirm.hp = 1;
    const r = act(s, attack(skirm, foe));
    const u = r.state.units.find((x) => x.uid === skirm.uid)!;
    if (u.downed || u.gone) expect(r.state.pursue).toBeUndefined();
    else expect(r.state.pursue).toBeDefined();
  });

  it('does not open when there is nowhere to go (boxed in by enemies)', () => {
    const { s, skirm, foe } = scene();
    skirm.pos = [4, 5];
    for (const p of [[3, 5], [4, 4], [4, 6]] as Pos[]) place(s, 'enemy', 'brigand', p, 'iron_axe');
    expect(act(s, attack(skirm, foe)).state.pursue).toBeUndefined();
  });

  it('moves the skirmisher to a tile of the rest area and closes the possibility', () => {
    const { s, skirm, foe } = scene();
    const a = act(s, attack(skirm, foe)).state;
    const reach = pursueReach(data, a, a.units.find((u) => u.uid === skirm.uid)!)!;
    expect(reach.has('2,5')).toBe(true);
    const r = act(a, { type: 'pursue', unit: skirm.uid, to: [2, 5] });
    const u = r.state.units.find((x) => x.uid === skirm.uid)!;
    expect(u.pos).toEqual([2, 5]);
    expect(u.acted).toBe(true);
    expect(r.state.pursue).toBeUndefined();
    expect(r.events.some((e) => e.t === 'moved')).toBe(true);
    expect(validate(data, r.state, { type: 'pursue', unit: skirm.uid, to: [1, 5] })).toBe('no_pursue');
  });

  it('refuses a tile beyond the rest, an occupied tile and the own tile', () => {
    const { s, skirm, foe } = scene();
    const a = act(s, attack(skirm, foe)).state;
    const left = a.pursue!.left;
    expect(validate(data, a, { type: 'pursue', unit: skirm.uid, to: [4 - left - 1, 5] })).toBe('unreachable');
    expect(validate(data, a, { type: 'pursue', unit: skirm.uid, to: foe.pos! })).toBe('unreachable');
    expect(validate(data, a, { type: 'pursue', unit: skirm.uid, to: [4, 5] })).toBe('unreachable');
    place(a, 'player', 'vanguard', [4, 6], 'iron_lance');
    expect(validate(data, a, { type: 'pursue', unit: skirm.uid, to: [4, 6] })).toBe('occupied');
  });

  it('refuses pursue without the possibility', () => {
    const { s, skirm } = scene();
    expect(validate(data, s, { type: 'pursue', unit: skirm.uid, to: [2, 5] })).toBe('no_pursue');
  });

  it('is ended by endPhase, equip and a command of another unit', () => {
    const { s, skirm, foe, mate } = scene();
    const a = act(s, attack(skirm, foe)).state;
    expect(a.pursue).toBeDefined();
    expect(act(a, { type: 'endPhase' }).state.pursue).toBeUndefined();
    const eq: Command = { type: 'equip', unit: mate.uid, item: mate.equip.mainHand!.uid, slot: 'mainHand' };
    expect(act(a, eq).state.pursue).toBeUndefined();
    const other = act(a, { type: 'act', unit: mate.uid, to: [1, 1], action: { kind: 'wait' } }).state;
    expect(other.pursue).toBeUndefined();
    expect(validate(data, other, { type: 'pursue', unit: skirm.uid, to: [2, 5] })).toBe('no_pursue');
  });

  it('respects Halten in the pursuit move', () => {
    const { s, skirm, foe } = scene();
    place(s, 'enemy', 'vanguard', [2, 3], 'iron_lance'); // hold zone: (2,2) (2,4) (1,3) (3,3)
    const a = act(s, attack(skirm, foe)).state;
    const reach = pursueReach(data, a, a.units.find((u) => u.uid === skirm.uid)!)!;
    expect(reach.has('2,4')).toBe(true);
    expect(viaTile(reach, '2,4')).toHaveLength(0);
  });

  it('is not used by the AI: an enemy skirmisher that attacks leaves no chance behind', () => {
    const { s } = scene();
    place(s, 'enemy', 'skirmisher', [3, 4], 'iron_sword');
    const r = act(s, { type: 'endPhase' });
    expect(r.state.pursue).toBeUndefined();
    expect(r.events.some((e) => e.t === 'strike')).toBe(true);
  });

  it('replays to the same state from start state and command log', () => {
    const { s, skirm, foe } = scene();
    const log: Command[] = [attack(skirm, foe), { type: 'pursue', unit: skirm.uid, to: [2, 5] }, { type: 'endPhase' }];
    let live = s;
    for (const c of log) live = act(live, c).state;
    expect(replayBattle(data, s, log)).toEqual(live);
  });

  it('previews from the same code: rest for the skirmisher, zone for the vanguard, nothing for others', () => {
    const { s, skirm, mate } = scene();
    expect(passivePreview(data, s, skirm, [4, 5])).toEqual({ kind: 'pursue', left: moveBudget(data, s, skirm) - 1 });
    expect(passivePreview(data, s, skirm, skirm.pos!)).toEqual({ kind: 'pursue', left: moveBudget(data, s, skirm) });
    const h = passivePreview(data, s, mate, [8, 8]);
    expect(h?.kind).toBe('hold');
    expect(h && h.kind === 'hold' && h.tiles.map(posKey).sort()).toEqual(['7,8', '8,7', '8,9', '9,8']);
    expect(passivePreview(data, s, place(s, 'player', 'marksman', [9, 9], 'iron_bow'), [9, 9])).toBeNull();
  });
});
