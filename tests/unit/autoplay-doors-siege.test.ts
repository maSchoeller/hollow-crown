/** Autoplay opens a locked door that blocks its goal and walks up to foes that never move (fenced yard). Synthetic arenas, no content maps. */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCommand, autoCommand, newItem, type BattleState, type GameData, type MapDef, type Pos } from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
const restore: Array<() => void> = [];

beforeAll(() => {
  data = loadContentFromDisk().data;
});

afterEach(() => {
  while (restore.length) restore.pop()!();
});

/** The map's victory for the test; the arena is built on the prologue. */
function victory(s: BattleState, v: MapDef['objectives']['victory']): void {
  const map = data.maps[s.mapId]!;
  const was = map.objectives.victory;
  map.objectives.victory = v;
  restore.push(() => (map.objectives.victory = was));
}

function setTerrain(s: BattleState, at: Pos, id: string): void {
  s.terrain[at[1] * s.width + at[0]] = id;
}

/** A wall across row 8 with a locked door at (5,8); the player side is south of it, the foe north. */
function lockedHall(): BattleState {
  const s = arena(data);
  victory(s, { type: 'rout' });
  for (let x = 0; x < s.width; x++) setTerrain(s, [x, 8], 'wall');
  setTerrain(s, [5, 8], 'door');
  s.objects.push({ id: 'door_t', type: 'door', at: [5, 8], state: 'closed' });
  const foe = place(data, s, 'enemy', 'skirmisher', [5, 3], 'iron_sword');
  foe.hp = 1;
  return s;
}

/** Plays up to `n` commands of autoCommand; every command must be legal (applyCommand throws otherwise). */
function play(s: BattleState, n: number): BattleState {
  for (let i = 0; i < n && !s.outcome; i++) s = applyCommand(data, s, autoCommand(data, s)).state;
  return s;
}

describe('autoplay and locked doors', () => {
  it('a scout walks to the door, opens it and the rout is won behind it', () => {
    const s = lockedHall();
    place(data, s, 'player', 'scout', [5, 13], 'iron_dagger');
    const end = play(s, 120);
    expect(end.objects.find((o) => o.id === 'door_t')!.state).toBe('open');
    expect(end.outcome).toBe('victory');
  });

  it('a unit with a door key opens the door with it and uses up the charge', () => {
    const s = lockedHall();
    const u = place(data, s, 'player', 'vanguard', [5, 13], 'iron_lance');
    u.bag.push(newItem(s, 'door_key', data));
    const end = play(s, 120);
    expect(end.objects.find((o) => o.id === 'door_t')!.state).toBe('open');
    expect(end.units.find((x) => x.uid === u.uid)!.bag.some((i) => i.def === 'door_key' && (i.charges ?? 1) > 0)).toBe(false);
    expect(end.outcome).toBe('victory');
  });

  it('a unit without a key fetches a key a thief dropped on the ground, then the key opens the door', () => {
    const s = lockedHall();
    place(data, s, 'player', 'vanguard', [8, 13], 'iron_lance');
    s.loot.push({ at: [2, 13], item: newItem(s, 'door_key', data) });
    const end = play(s, 160);
    expect(end.loot).toHaveLength(0);
    expect(end.objects.find((o) => o.id === 'door_t')!.state).toBe('open');
    expect(end.outcome).toBe('victory');
  });

  it('without a scout, a key or a key on the ground the door stays shut and every command stays legal', () => {
    const s = lockedHall();
    place(data, s, 'player', 'vanguard', [5, 13], 'iron_lance');
    const end = play(s, 60);
    expect(end.objects.find((o) => o.id === 'door_t')!.state).toBe('closed');
    expect(end.outcome).toBeNull();
  });
});

describe('autoplay and foes that never move', () => {
  /** A yard fenced on three sides (x 3..7, y 3..6), open to the south; two held foes stand on its inner side of the entrance. */
  function yard(): BattleState {
    const s = arena(data);
    victory(s, { type: 'rout' });
    for (let x = 3; x <= 7; x++) setTerrain(s, [x, 3], 'fence');
    for (let y = 3; y <= 6; y++) {
      setTerrain(s, [3, y], 'fence');
      setTerrain(s, [7, y], 'fence');
    }
    for (const at of [[4, 6], [6, 6]] as Pos[]) place(data, s, 'enemy', 'skirmisher', at, 'iron_sword').hp = 1;
    return s;
  }

  it('walks around the fence and through the entrance to kill held foes', () => {
    const s = yard();
    place(data, s, 'player', 'vanguard', [5, 0], 'iron_lance');
    place(data, s, 'player', 'vanguard', [4, 0], 'iron_lance');
    const end = play(s, 400);
    expect(end.units.filter((u) => u.team === 'enemy' && u.pos && !u.gone && !u.downed)).toHaveLength(0);
    expect(end.outcome).toBe('victory');
  });

  it('does not charge held foes while another foe still comes at the company', () => {
    const s = yard();
    const hunter = place(data, s, 'enemy', 'skirmisher', [10, 14], 'iron_sword');
    hunter.ai = { profile: 'aggressive' };
    place(data, s, 'player', 'vanguard', [5, 12], 'iron_lance');
    const cmd = autoCommand(data, s);
    // nothing in the yard is attacked from the entrance on the first command: the unit does not walk into both held foes
    expect(cmd.type).toBe('act');
    if (cmd.type === 'act') {
      const near = [[4, 6], [6, 6]].some(([x, y]) => Math.abs(cmd.to[0] - x!) + Math.abs(cmd.to[1] - y!) <= 1);
      expect(near).toBe(false);
    }
  });
});
