/** Wirken (Elementarist), story 2.5 (GDD Rollenklassen, Gelände und Umwelteffekte). Built on fixtures: an arena with units placed by the tests. */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  availableActions,
  beginBattle,
  castArea,
  castBlock,
  castTargets,
  classPreview,
  CoreInvariantError,
  liftedTiles,
  newCampaign,
  newItem,
  posKey,
  replayBattle,
  runAiPhase,
  tickTerrain,
  validate,
  computeStats,
  type BattleState,
  type BattleUnit,
  type Command,
  type GameData,
  type GameEvent,
  type Pos,
} from '../../src/core';

let data: GameData;
const restore: Array<() => void> = [];

/** Prologue state with every unit removed from the map except the ones a test places itself, on an open field. */
function arena(): BattleState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  for (const u of s.units) u.pos = null;
  s.units.forEach((u) => (u.gone = 'retreated'));
  s.outcome = null;
  s.lockedRoles = [];
  s.terrain = s.terrain.map(() => 'plain');
  s.objects = [];
  s.loot = [];
  s.timers = {};
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

const setTile = (s: BattleState, p: Pos, terrain: string) => (s.terrain[p[1] * s.width + p[0]] = terrain);
const tileOf = (s: BattleState, p: Pos) => s.terrain[p[1] * s.width + p[0]];
const cast = (s: BattleState, u: BattleUnit, at: Pos, to?: Pos) =>
  applyCommand(data, s, { type: 'act', unit: u.uid, to: to ?? u.pos!, action: { kind: 'cast', at } });
const endPhase = (s: BattleState) => applyCommand(data, s, { type: 'endPhase' });
const unit = (s: BattleState, uid: string) => s.units.find((u) => u.uid === uid)!;
/** A foe that only stands still (no weapon), so enemy phases never move it away from the test tile. */
const dummy = (s: BattleState, at: Pos) => {
  const foe = place(s, 'enemy', 'vanguard', at);
  foe.ai = { profile: 'hold' };
  return foe;
};
/** The map of the arena gets fog (wind needs it); undone after the test. */
function withFog(s: BattleState, fog = true): void {
  const map = data.maps[s.mapId]!;
  const was = map.fog;
  map.fog = fog;
  restore.push(() => (map.fog = was));
}
/** The map's victory objective for the AI tests; undone after the test. */
function withObjective(s: BattleState, victory: (typeof data.maps)[string]['objectives']['victory']): void {
  const map = data.maps[s.mapId]!;
  const was = map.objectives.victory;
  map.objectives.victory = victory;
  restore.push(() => (map.objectives.victory = was));
}

beforeAll(() => {
  data = loadContentFromDisk().data;
});
afterEach(() => {
  while (restore.length) restore.pop()!();
});

describe('Wirken numbers', () => {
  it('has the cast numbers in balance.yaml', () => {
    expect(data.balance.classActions.cast).toEqual({ waterRadius: 1, fogDuration: 2 });
    expect(data.balance.ai).toMatchObject({ castMinTargets: 2, castWallDetour: 3, castLethalChance: 100 });
    expect(data.balance.terrainEffects).toMatchObject({ burningDuration: 2, rockwallDuration: 2, windFogClearRadius: 2 });
  });
});

describe('Wirken: who can cast and where', () => {
  it('reaches exactly the weapon range of the equipped tome, at least 1 tile, never the own tile', () => {
    const s = arena();
    for (let x = 0; x < 9; x++) for (let y = 0; y < 9; y++) setTile(s, [x, y], 'grass');
    const mage = place(s, 'player', 'elementalist', [4, 4], 'ember');
    const tiles = castTargets(data, s, mage, [4, 4]).map(posKey).sort();
    const expected: string[] = [];
    for (let x = 0; x < 9; x++) for (let y = 0; y < 9; y++) {
      const d = Math.abs(x - 4) + Math.abs(y - 4);
      if (d >= 1 && d <= 2) expected.push(`${x},${y}`);
    }
    expect(tiles).toEqual(expected.sort());
    expect(tiles).not.toContain('4,4');
  });

  it('lists the class action in availableActions with the tiles, and has none for other roles', () => {
    const s = arena();
    setTile(s, [5, 4], 'grass');
    const mage = place(s, 'player', 'elementalist', [4, 4], 'ember');
    const opt = availableActions(data, s, mage, [4, 4]).find((o) => o.kind === 'cast');
    expect(opt?.tiles?.map(posKey)).toEqual(['5,4']);
    const knight = place(s, 'player', 'vanguard', [2, 2], 'iron_lance');
    expect(availableActions(data, s, knight, [2, 2]).some((o) => o.kind === 'cast')).toBe(false);
    expect(castBlock(data, s, knight, [2, 2])).toBeNull();
  });

  it('also comes from the sage, and a locked role has no Wirken yet', () => {
    const s = arena();
    setTile(s, [5, 4], 'grass');
    const mage = place(s, 'player', 'sage', [4, 4], 'ember');
    expect(castTargets(data, s, mage, [4, 4])).toHaveLength(1);
    s.lockedRoles = ['elementalist'];
    expect(castTargets(data, s, mage, [4, 4])).toHaveLength(0);
  });

  it('is dimmed with a reason: no tome, light and dark, no valid tile', () => {
    const s = arena();
    const mage = place(s, 'player', 'elementalist', [4, 4], 'iron_sword');
    expect(castBlock(data, s, mage, [4, 4])).toBe('tome');
    mage.equip.mainHand = newItem(s, 'shine', data);
    expect(castBlock(data, s, mage, [4, 4])).toBe('element');
    mage.equip.mainHand = newItem(s, 'ember', data);
    expect(castBlock(data, s, mage, [4, 4])).toBe('target'); // all plain, nothing flammable in range
    setTile(s, [4, 5], 'grass');
    expect(castBlock(data, s, mage, [4, 4])).toBeNull();
    mage.equip = {};
    expect(castBlock(data, s, mage, [4, 4])).toBe('tome');
  });

  it('takes the element from a rune when the tome has none of its own', () => {
    const s = arena();
    setTile(s, [4, 5], 'grass');
    data.items.blank_tome = { ...data.items.ember!, id: 'blank_tome', element: undefined, terrainOnHit: undefined, statusOnHit: undefined };
    restore.push(() => delete data.items.blank_tome);
    const mage = place(s, 'player', 'elementalist', [4, 4]);
    mage.equip.mainHand = newItem(s, { def: 'blank_tome', runes: [] }, data);
    expect(castBlock(data, s, mage, [4, 4])).toBe('element');
    mage.equip.mainHand = newItem(s, { def: 'blank_tome', runes: ['fire_rune_1'] }, data);
    expect(castArea(data, s, mage, [4, 5])?.element).toBe('fire');
    expect(castTargets(data, s, mage, [4, 4]).map(posKey)).toEqual(['4,5']);
  });
});

describe('Wirken: Feuer', () => {
  it('only targets flammable tiles (grass, forest) and burning ones', () => {
    const s = arena();
    setTile(s, [5, 4], 'grass');
    setTile(s, [3, 4], 'forest');
    setTile(s, [4, 5], 'sand');
    const mage = place(s, 'player', 'elementalist', [4, 4], 'ember');
    expect(castTargets(data, s, mage, [4, 4]).map(posKey).sort()).toEqual(['3,4', '5,4']);
    const cmd: Command = { type: 'act', unit: mage.uid, to: [4, 4], action: { kind: 'cast', at: [4, 5] } };
    expect(validate(data, s, cmd)).toBe('invalid_target');
  });

  it('sets the tile on fire for burningDuration rounds, replaces the action and draws no random number', () => {
    const s = arena();
    setTile(s, [5, 4], 'grass');
    const mage = place(s, 'player', 'elementalist', [4, 4], 'ember');
    const { state, events } = cast(s, mage, [5, 4]);
    expect(tileOf(state, [5, 4])).toBe('burning');
    expect(state.timers['5,4']).toEqual({ kind: 'burning', turns: data.balance.terrainEffects.burningDuration, revertTo: 'grass' });
    expect(events).toContainEqual({ t: 'classAction', unit: mage.uid, action: 'cast', at: [5, 4], element: 'fire' });
    expect(events).toContainEqual({ t: 'terrain', at: [5, 4], terrain: 'burning', cause: 'ignite' });
    expect(unit(state, mage.uid).acted).toBe(true);
    expect(state.rng).toEqual(s.rng);
    expect(() => cast(state, unit(state, mage.uid), [5, 4])).toThrow(CoreInvariantError);
  });

  it('burns friend and foe on the tile at the start of their phases (no damage when it is set)', () => {
    const s = arena();
    setTile(s, [6, 4], 'grass');
    setTile(s, [6, 6], 'grass');
    const mage = place(s, 'player', 'elementalist', [4, 4], 'ember');
    const friend = place(s, 'player', 'vanguard', [6, 4]);
    const foe = dummy(s, [6, 5]);
    setTile(s, [6, 5], 'grass');
    const foe2 = dummy(s, [6, 6]);
    const first = cast(s, mage, [6, 4], [5, 4]);
    expect(unit(first.state, friend.uid).hp).toBe(friend.hp);
    // the foe's tile is next to the fire; light it too, the second round's cast targets it directly
    const after = endPhase(first.state);
    expect(unit(after.state, friend.uid).hp).toBeLessThan(friend.hp); // own phase starts on the fire
    expect(unit(after.state, foe.uid).hp).toBe(foe.hp);
    expect(foe2.hp).toBe(unit(after.state, foe2.uid).hp);
    const burntFoe = cast(s, place(s, 'player', 'elementalist', [4, 5], 'ember'), [6, 5], [5, 5]);
    const second = endPhase(burntFoe.state);
    expect(unit(second.state, foe.uid).hp).toBeLessThan(foe.hp);
  });

  it('renews the duration on a burning tile and keeps the ground under it', () => {
    const s = arena();
    setTile(s, [5, 4], 'forest');
    const mage = place(s, 'player', 'elementalist', [4, 4], 'ember');
    dummy(s, [11, 11]);
    const one = cast(s, mage, [5, 4]).state;
    const ticked = structuredClone(one);
    tickTerrain(data, ticked, []);
    expect(ticked.timers['5,4']!.turns).toBe(1);
    const mage2 = unit(ticked, mage.uid);
    mage2.acted = false;
    mage2.moved = false;
    expect(castTargets(data, ticked, mage2, [4, 4]).map(posKey)).toContain('5,4');
    const again = cast(ticked, mage2, [5, 4]).state;
    expect(again.timers['5,4']).toEqual({ kind: 'burning', turns: 2, revertTo: 'forest' });
  });

  it('shows the target and its flammable neighbours as the affected area', () => {
    const s = arena();
    for (const p of [[5, 4], [6, 4], [5, 5], [4, 4]] as Pos[]) setTile(s, p, 'grass');
    const mage = place(s, 'player', 'elementalist', [3, 4], 'ember');
    const area = castArea(data, s, mage, [5, 4])!;
    expect(area.effect).toBe('ignite');
    expect(area.tiles.map(posKey).sort()).toEqual(['4,4', '5,4', '5,5', '6,4']);
    expect(area.turns).toBe(2);
  });

  it('spreads from the seeded stream only, so a replay gives an identical state', () => {
    const s = arena();
    for (let x = 2; x < 12; x++) for (let y = 2; y < 12; y++) setTile(s, [x, y], 'grass');
    const mage = place(s, 'player', 'elementalist', [3, 3], 'ember');
    dummy(s, [11, 11]);
    // walk first, then cast from the closer tile
    const log: Command[] = [{ type: 'act', unit: mage.uid, to: [5, 5], action: { kind: 'cast', at: [6, 6] } }];
    for (let i = 0; i < 6; i++) log.push({ type: 'endPhase' });
    let live = s;
    for (const c of log) live = applyCommand(data, live, c).state;
    const replay = replayBattle(data, s, log);
    expect(replay).toEqual(live);
    // the spread rolls moved the stream on
    expect(live.rng).not.toEqual(s.rng);
    // casting alone never draws a number
    expect(applyCommand(data, s, log[0]!).state.rng).toEqual(s.rng);
  });
});

describe('Wirken: Wasser', () => {
  it('puts out fire around the target (radius 1) and makes the units there wet, friend and foe', () => {
    const s = arena();
    for (const p of [[6, 4], [7, 4], [6, 5], [9, 9]] as Pos[]) setTile(s, p, 'grass');
    const mage = place(s, 'player', 'elementalist', [4, 4], 'surge');
    const friend = place(s, 'player', 'vanguard', [7, 4]);
    const foe = dummy(s, [6, 5]);
    foe.status = [{ id: 'burning', turns: 2 }];
    // fire on two tiles of the area and one outside it
    for (const p of [[6, 4], [7, 4], [9, 9]] as Pos[]) s.timers[posKey(p)] = { kind: 'burning', turns: 2, revertTo: 'grass' };
    for (const p of [[6, 4], [7, 4], [9, 9]] as Pos[]) setTile(s, p, 'burning');
    const area = castArea(data, s, mage, [6, 4])!;
    expect(area.tiles.map(posKey).sort()).toEqual(['5,4', '6,3', '6,4', '6,5', '7,4']);
    expect(area.units.sort()).toEqual([friend.uid, foe.uid].sort());
    expect(area.extinguished).toBe(2);
    const { state, events } = cast(s, mage, [6, 4], [5, 4]);
    expect(tileOf(state, [6, 4])).toBe('grass');
    expect(tileOf(state, [7, 4])).toBe('grass');
    expect(tileOf(state, [9, 9])).toBe('burning');
    expect(state.timers['6,4']).toBeUndefined();
    expect(unit(state, friend.uid).status.map((x) => x.id)).toEqual(['wet']);
    expect(unit(state, foe.uid).status.map((x) => x.id)).toEqual(['wet']); // wet replaced burning
    expect(events.filter((e) => e.t === 'terrain' && e.cause === 'extinguish')).toHaveLength(2);
    expect(state.rng).toEqual(s.rng);
  });

  it('cannot be aimed at a rockwall', () => {
    const s = arena();
    s.timers['5,4'] = { kind: 'rockwall', turns: 2, revertTo: 'plain' };
    setTile(s, [5, 4], 'rockwall');
    const mage = place(s, 'player', 'elementalist', [4, 4], 'surge');
    expect(castTargets(data, s, mage, [4, 4]).map(posKey)).not.toContain('5,4');
    expect(castTargets(data, s, mage, [4, 4]).map(posKey)).toContain('4,5');
  });
});

describe('Wirken: Erde', () => {
  it('raises a rockwall that blocks the tile for rockwallDuration rounds, then the ground is back', () => {
    const s = arena();
    const mage = place(s, 'player', 'elementalist', [4, 4], 'rockfall');
    dummy(s, [11, 11]);
    const { state, events } = cast(s, mage, [5, 4]);
    expect(tileOf(state, [5, 4])).toBe('rockwall');
    expect(events).toContainEqual({ t: 'terrain', at: [5, 4], terrain: 'rockwall', cause: 'rockwall' });
    const r1 = endPhase(state).state; // end of round N: still there
    expect(tileOf(r1, [5, 4])).toBe('rockwall');
    expect(r1.timers['5,4']!.turns).toBe(1);
    const r2 = endPhase(r1).state; // end of round N+1: gone
    expect(tileOf(r2, [5, 4])).toBe('plain');
    expect(r2.timers['5,4']).toBeUndefined();
  });

  it('is only placed on a free tile without object or loot, and not on an already blocked tile', () => {
    const s = arena();
    const mage = place(s, 'player', 'elementalist', [4, 4], 'rockfall');
    place(s, 'player', 'vanguard', [5, 4]);
    const dead = place(s, 'enemy', 'vanguard', [3, 4]);
    dead.downed = true;
    s.objects.push({ id: 'chest1', type: 'chest', at: [4, 5], state: 'closed' });
    s.loot.push({ at: [4, 3], item: newItem(s, 'iron_sword', data) });
    setTile(s, [5, 5], 'wall');
    setTile(s, [3, 5], 'mountain');
    setTile(s, [3, 3], 'throne');
    const tiles = castTargets(data, s, mage, [4, 4]).map(posKey);
    for (const k of ['5,4', '3,4', '4,5', '4,3', '5,5', '3,5', '3,3']) expect(tiles).not.toContain(k);
    expect(tiles).toContain('6,4');
    expect(tiles).toContain('4,2');
  });

  it('counts the caster\'s own old tile as free when it walks away first', () => {
    const s = arena();
    const mage = place(s, 'player', 'elementalist', [4, 4], 'rockfall');
    const { state } = cast(s, mage, [4, 4], [4, 6]);
    expect(tileOf(state, [4, 4])).toBe('rockwall');
    expect(unit(state, mage.uid).pos).toEqual([4, 6]);
  });

  it('replaces fire on the tile (the ground before the fire comes back, not a fire without timer)', () => {
    const s = arena();
    setTile(s, [5, 4], 'grass');
    const mage = place(s, 'player', 'elementalist', [4, 4], 'ember');
    const mage2 = place(s, 'player', 'elementalist', [3, 4], 'rockfall');
    dummy(s, [11, 11]);
    const burning = cast(s, mage, [5, 4]).state;
    expect(tileOf(burning, [5, 4])).toBe('burning');
    expect(castTargets(data, burning, unit(burning, mage2.uid), [3, 4]).map(posKey)).toContain('5,4');
    const walled = cast(burning, unit(burning, mage2.uid), [5, 4]).state;
    expect(tileOf(walled, [5, 4])).toBe('rockwall');
    expect(walled.timers['5,4']).toEqual({ kind: 'rockwall', turns: 2, revertTo: 'grass' });
    const r2 = endPhase(endPhase(walled).state).state;
    expect(tileOf(r2, [5, 4])).toBe('grass');
    expect(r2.timers['5,4']).toBeUndefined();
  });

  it('is not allowed for fire or water on a rockwall; a second wall renews the duration', () => {
    const s = arena();
    const fireMage = place(s, 'player', 'elementalist', [4, 4], 'ember');
    const earthMage = place(s, 'player', 'elementalist', [3, 4], 'rockfall');
    dummy(s, [11, 11]);
    const walled = cast(s, earthMage, [5, 4]).state;
    expect(castTargets(data, walled, unit(walled, fireMage.uid), [4, 4]).map(posKey)).not.toContain('5,4');
    const ticked = structuredClone(walled);
    tickTerrain(data, ticked, []);
    expect(ticked.timers['5,4']!.turns).toBe(1);
    const mage = unit(ticked, earthMage.uid);
    mage.acted = false;
    expect(castTargets(data, ticked, mage, [3, 4]).map(posKey)).toContain('5,4');
    const renewed = cast(ticked, mage, [5, 4]).state;
    expect(renewed.timers['5,4']).toEqual({ kind: 'rockwall', turns: 2, revertTo: 'plain' });
  });
});

describe('Wirken: Felswall, Ziele und Reichweite', () => {
  it('keeps mission goal tiles free', () => {
    const s = arena();
    withObjective(s, { type: 'reach', area: { tiles: [[5, 4]] } });
    const mage = place(s, 'player', 'elementalist', [4, 4], 'rockfall');
    const tiles = castTargets(data, s, mage, [4, 4]).map(posKey);
    expect(tiles).not.toContain('5,4');
    expect(tiles).toContain('6,4');
  });

  it('uses utility.rng of the tome as the range (stone_wall: 1 to 3), else the weapon range', () => {
    const s = arena();
    const mage = place(s, 'player', 'elementalist', [4, 4], 'stone_wall');
    const d = (p: string) => p.split(',').map(Number).reduce((a, b) => a + Math.abs(b - 4), 0);
    const far = castTargets(data, s, mage, [4, 4]).map(posKey);
    expect(Math.max(...far.map(d))).toBe(3);
    mage.equip.mainHand = newItem(s, 'rockfall', data);
    expect(Math.max(...castTargets(data, s, mage, [4, 4]).map(posKey).map(d))).toBe(2);
  });
});

describe('Wirken: Wind', () => {
  it('is dimmed with the reason "no fog" on a map without fog', () => {
    const s = arena();
    const mage = place(s, 'player', 'elementalist', [4, 4], 'gust');
    expect(castBlock(data, s, mage, [4, 4])).toBe('fog');
    expect(availableActions(data, s, mage, [4, 4]).some((o) => o.kind === 'cast')).toBe(false);
    expect(validate(data, s, { type: 'act', unit: mage.uid, to: [4, 4], action: { kind: 'cast', at: [5, 4] } })).toBe('not_allowed');
  });

  it('lifts fog in radius 2 for the team of the caster for 2 rounds, as plain state', () => {
    const s = arena();
    withFog(s);
    const mage = place(s, 'player', 'elementalist', [4, 4], 'gust');
    dummy(s, [11, 11]);
    expect(castBlock(data, s, mage, [4, 4])).toBeNull();
    const area = castArea(data, s, mage, [6, 4])!;
    expect(area.effect).toBe('fog');
    expect(area.tiles).toHaveLength(13);
    const { state, events } = cast(s, mage, [6, 4]);
    expect(events).toContainEqual({ t: 'classAction', unit: mage.uid, action: 'cast', at: [6, 4], element: 'wind' });
    expect(state.fogLifted).toEqual([{ team: 'player', at: [6, 4], radius: 2, turns: 2 }]);
    expect(liftedTiles(state, 'player').size).toBe(13);
    expect(liftedTiles(state, 'player').has('8,4')).toBe(true);
    expect(liftedTiles(state, 'player').has('9,4')).toBe(false);
    expect(liftedTiles(state, 'enemy').size).toBe(0);
    expect(state.rng).toEqual(s.rng);
    expect(structuredClone(state)).toEqual(state);
    const r1 = endPhase(state).state;
    expect(liftedTiles(r1, 'player').size).toBe(13);
    const r2 = endPhase(r1).state;
    expect(liftedTiles(r2, 'player').size).toBe(0);
    expect(r2.fogLifted).toBeUndefined();
  });

  it('renews the same lift instead of stacking it', () => {
    const s = arena();
    withFog(s);
    const mage = place(s, 'player', 'elementalist', [4, 4], 'gust');
    dummy(s, [11, 11]);
    const one = cast(s, mage, [6, 4]).state;
    const ticked = structuredClone(one);
    tickTerrain(data, ticked, []);
    expect(ticked.fogLifted![0]!.turns).toBe(1);
    const m = unit(ticked, mage.uid);
    m.acted = false;
    const again = cast(ticked, m, [6, 4]).state;
    expect(again.fogLifted).toEqual([{ team: 'player', at: [6, 4], radius: 2, turns: 2 }]);
  });
});

describe('Wirken: Vorschau und Befehle', () => {
  it('previews what the resolution then does (same tiles and units)', () => {
    const s = arena();
    for (const p of [[6, 4], [7, 4]] as Pos[]) setTile(s, p, 'grass');
    const mage = place(s, 'player', 'elementalist', [4, 4], 'surge');
    const friend = place(s, 'player', 'vanguard', [6, 5]);
    const pre = classPreview(data, s, mage, [5, 4], { kind: 'cast', at: [6, 4] });
    expect(pre?.kind).toBe('cast');
    if (pre?.kind !== 'cast') return;
    const { state, events } = cast(s, mage, [6, 4], [5, 4]);
    const wet = events.filter((e): e is Extract<GameEvent, { t: 'status' }> => e.t === 'status' && e.status === 'wet' && e.on).map((e) => e.unit);
    expect(wet.sort()).toEqual([...pre.area.units].sort());
    expect(pre.area.units).toContain(friend.uid);
    expect(unit(state, friend.uid).status.some((x) => x.id === 'wet')).toBe(true);
  });

  it('previews the same field list for a wall as the one it raises', () => {
    const s = arena();
    const mage = place(s, 'player', 'elementalist', [4, 4], 'rockfall');
    const pre = classPreview(data, s, mage, [4, 4], { kind: 'cast', at: [5, 4] });
    expect(pre).toMatchObject({ kind: 'cast', area: { effect: 'rockwall', tiles: [[5, 4]], turns: 2 } });
  });

  it('rejects an invalid tile, and a cast from a unit without Wirken', () => {
    const s = arena();
    const mage = place(s, 'player', 'elementalist', [4, 4], 'rockfall');
    const knight = place(s, 'player', 'vanguard', [2, 2], 'iron_lance');
    expect(validate(data, s, { type: 'act', unit: mage.uid, to: [4, 4], action: { kind: 'cast', at: [9, 9] } })).toBe('invalid_target');
    expect(validate(data, s, { type: 'act', unit: knight.uid, to: [2, 2], action: { kind: 'cast', at: [3, 2] } })).toBe('not_allowed');
    try {
      cast(s, mage, [9, 9]);
    } catch (e) {
      expect(e).toBeInstanceOf(CoreInvariantError);
      expect((e as CoreInvariantError).code).toBe('invalid_command');
      expect((e as CoreInvariantError).details).toMatchObject({ command: 'act', reason: 'invalid_target' });
    }
  });
});

/** AI scenes: a corridor along row 5 (mountains elsewhere) with the goal at its east end, or open grass. */
function corridor(): { s: BattleState; goal: Pos } {
  const s = arena();
  for (let x = 0; x < s.width; x++) for (let y = 0; y < s.height; y++) setTile(s, [x, y], y === 5 && x >= 1 && x <= s.width - 2 ? 'plain' : 'mountain');
  const goal: Pos = [s.width - 2, 5];
  withObjective(s, { type: 'seize', area: { tiles: [goal] } });
  return { s, goal };
}
const casts = (events: GameEvent[]) => events.filter((e) => e.t === 'classAction' && e.action === 'cast');

describe('Wirken: KI', () => {
  it('casts fire instead of attacking when 2 player units stand in the spread area', () => {
    const s = arena();
    for (let x = 2; x < 9; x++) for (let y = 2; y < 9; y++) setTile(s, [x, y], 'grass');
    const wizard = place(s, 'enemy', 'elementalist', [3, 3], 'ember');
    wizard.ai = { profile: 'hold' };
    const a = place(s, 'player', 'vanguard', [5, 3]);
    const b = place(s, 'player', 'vanguard', [5, 4]);
    a.hp = b.hp = 60;
    const events: GameEvent[] = [];
    runAiPhase(data, s, 'enemy', events);
    expect(casts(events)).toHaveLength(1);
    expect(casts(events)[0]).toMatchObject({ unit: wizard.uid, element: 'fire' });
    expect(events.some((e) => e.t === 'combat')).toBe(false);
    expect(s.timers['5,3'] ?? s.timers['5,4'] ?? s.timers['4,3'] ?? s.timers['4,4']).toBeDefined();
    expect(wizard.acted).toBe(true);
  });

  it('attacks as before with only one player unit in the area, or when its own units stand there too', () => {
    const base = () => {
      const s = arena();
      for (let x = 2; x < 9; x++) for (let y = 2; y < 9; y++) setTile(s, [x, y], 'grass');
      const wizard = place(s, 'enemy', 'elementalist', [3, 3], 'ember');
      wizard.ai = { profile: 'hold' };
      return { s, wizard };
    };
    const one = base();
    place(one.s, 'player', 'vanguard', [5, 3]).hp = 60;
    const e1: GameEvent[] = [];
    runAiPhase(data, one.s, 'enemy', e1);
    expect(casts(e1)).toHaveLength(0);
    expect(e1.some((e) => e.t === 'combat')).toBe(true);

    const mixed = base();
    place(mixed.s, 'player', 'vanguard', [5, 3]).hp = 60;
    place(mixed.s, 'player', 'vanguard', [5, 4]).hp = 60;
    const friend = place(mixed.s, 'enemy', 'vanguard', [4, 3]);
    friend.ai = { profile: 'hold' };
    const e2: GameEvent[] = [];
    runAiPhase(data, mixed.s, 'enemy', e2);
    expect(casts(e2)).toHaveLength(0);
  });

  it('does not cast when the best attack is lethal', () => {
    const s = arena();
    for (let x = 2; x < 9; x++) for (let y = 2; y < 9; y++) setTile(s, [x, y], 'grass');
    const wizard = place(s, 'enemy', 'elementalist', [3, 3], 'ember');
    wizard.ai = { profile: 'hold' };
    wizard.hp = 60;
    const a = place(s, 'player', 'vanguard', [5, 3]);
    const b = place(s, 'player', 'vanguard', [5, 4]);
    a.hp = 1;
    b.hp = 60;
    a.equip = {};
    // a hit is never 100 %: the limit is lowered so the strike on the 1 HP unit counts as sure
    data.balance.ai.castLethalChance = 50;
    restore.push(() => (data.balance.ai.castLethalChance = 100));
    const events: GameEvent[] = [];
    runAiPhase(data, s, 'enemy', events);
    expect(casts(events)).toHaveLength(0);
    expect(events.some((e) => e.t === 'combat')).toBe(true);
  });

  it('raises a wall when it blocks the way of the player to the goal', () => {
    const { s } = corridor();
    const wizard = place(s, 'enemy', 'elementalist', [8, 5], 'rockfall');
    wizard.ai = { profile: 'hold' };
    place(s, 'player', 'vanguard', [2, 5]);
    const events: GameEvent[] = [];
    runAiPhase(data, s, 'enemy', events);
    const c = casts(events);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ element: 'earth' });
    expect(s.terrain.filter((t) => t === 'rockwall')).toHaveLength(1);
  });

  it('does not wall in open ground (detour under the limit), without a goal tile, or for support and flee profiles', () => {
    // open field: the way around costs 2 at most
    const open = arena();
    withObjective(open, { type: 'seize', area: { tiles: [[open.width - 2, 5]] } });
    const w1 = place(open, 'enemy', 'elementalist', [8, 5], 'rockfall');
    w1.ai = { profile: 'hold' };
    place(open, 'player', 'vanguard', [2, 5]);
    const e1: GameEvent[] = [];
    runAiPhase(data, open, 'enemy', e1);
    expect(casts(e1)).toHaveLength(0);

    // a corridor but a rout map: no goal tile
    const rout = corridor();
    withObjective(rout.s, { type: 'rout' });
    const w2 = place(rout.s, 'enemy', 'elementalist', [8, 5], 'rockfall');
    w2.ai = { profile: 'hold' };
    place(rout.s, 'player', 'vanguard', [2, 5]);
    const e2: GameEvent[] = [];
    runAiPhase(data, rout.s, 'enemy', e2);
    expect(casts(e2)).toHaveLength(0);

    for (const profile of ['support', 'flee', 'raider'] as const) {
      const c = corridor();
      const w = place(c.s, 'enemy', 'elementalist', [8, 5], 'rockfall');
      w.ai = { profile, area: { tiles: [[1, 5]] } };
      place(c.s, 'player', 'vanguard', [2, 5]);
      const ev: GameEvent[] = [];
      runAiPhase(data, c.s, 'enemy', ev);
      expect(casts(ev)).toHaveLength(0);
    }
  });

  it('plays the same way twice (deterministic) and keeps the state structured-cloneable', () => {
    const run = () => {
      const { s } = corridor();
      const wizard = place(s, 'enemy', 'elementalist', [8, 5], 'rockfall');
      wizard.ai = { profile: 'aggressive' };
      place(s, 'player', 'vanguard', [2, 5]);
      const ev: GameEvent[] = [];
      runAiPhase(data, s, 'enemy', ev);
      return { s, ev };
    };
    const a = run();
    const b = run();
    expect(a.s).toEqual(b.s);
    expect(a.ev).toEqual(b.ev);
    expect(structuredClone(a.s)).toEqual(a.s);
    expect(casts(a.ev)).toHaveLength(1);
  });
});
