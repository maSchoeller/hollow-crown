/** Maps 1-5, N1, N2 and N3 on their accepted drafts: height levels where the place has them, Varek's move to N2, and the memorial variants that stay playable. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { addToRoster, applyCommand, attackTargets, availableActions, checkObjectives, createBattle, levelAt, newCampaign, reachable, resolveScene, conditionContext, runAiPhase, threatTiles, type BattleState, type CampaignState, type GameData, type GameEvent } from '../../src/core';

let data: GameData;
const fresh = (...extra: string[]): CampaignState => {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  for (const id of extra) if (!c.roster.some((u) => u.id === id)) addToRoster(data, c, id);
  return c;
};
const battle = (node: string, ...extra: string[]): BattleState => {
  const c = fresh(...extra);
  return createBattle(data, c, node, c.roster.map((r) => r.id));
};
const tile = (mapId: string, x: number, y: number) => {
  const m = data.maps[mapId]!;
  return m.legend[m.terrain.replace(/\r/g, '').split('\n')[y]![x]!];
};
const keys = (u: { items: Array<{ def: string }> }) => u.items.filter((i) => i.def === 'door_key').length;
const chests = (mapId: string) => data.maps[mapId]!.objects.filter((o) => o.type === 'chest').length;
const check = (s: BattleState) => {
  const ev: GameEvent[] = [];
  checkObjectives(data, s, ev);
  return s.outcome;
};

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('1-5 on the Alder Moor', () => {
  const MAP = 'm1_5_hungerlager';

  it('raises the old watch hill to level 1 with two ramps, and nothing else', () => {
    const s = battle('m1_5');
    const at = (x: number, y: number) => levelAt(data, s, [x, y]);
    expect([at(8, 11), at(11, 13), at(9, 12), at(10, 12)]).toEqual([1, 1, 1, 1]);
    expect([at(7, 12), at(12, 12), at(9, 14), at(10, 10), at(10, 2), at(3, 12)]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(tile(MAP, 7, 12)).toBe('ramp');
    expect(tile(MAP, 12, 12)).toBe('ramp');
    expect(tile(MAP, 9, 12)).toBe('fort');
    expect(data.maps[MAP]!.levels).toHaveLength(1);
  });

  it('gets up only over the ramps: the south edge of the hill is a cliff', () => {
    const s = battle('m1_5');
    const unit = s.units.find((u) => u.team === 'player')!;
    expect([...reachable(data, s, unit, [9, 14], 3).keys()]).not.toContain('9,13');
    expect([...reachable(data, s, unit, [6, 12], 2).keys()]).toContain('8,12');
  });

  it('gives a bow on the hill +1 range, and a melee foe below no blow except from the ramp', () => {
    const s = battle('m1_5');
    const archer = s.units.find((u) => u.id === 'g3')!;
    const foe = s.units.find((u) => u.team === 'player')!;
    foe.pos = [8, 15];
    archer.pos = [8, 12];
    expect(Object.keys(attackTargets(data, s, archer, [8, 12]))).toContain(foe.uid);
    archer.pos = [8, 14];
    const flat = s.units.find((u) => u.id === 'g4')!;
    flat.pos = [8, 18];
    expect(Object.keys(attackTargets(data, s, flat, [8, 18]))).not.toContain(foe.uid);

    const blade = s.units.find((u) => u.id === 'g2')!;
    foe.pos = [8, 11];
    blade.pos = [7, 11];
    expect(Object.keys(attackTargets(data, s, blade, [7, 11]))).not.toContain(foe.uid);
    foe.pos = [8, 12];
    blade.pos = [7, 12];
    expect(Object.keys(attackTargets(data, s, blade, [7, 12]))).toContain(foe.uid);
  });

  it('has lost Varek and his scenes; a hungry man at the hut points to the watchtower', () => {
    const m = data.maps[MAP]!;
    expect(m.units.some((u) => u.id === 'varek' || u.char === 'varek')).toBe(false);
    expect(m.objectives.side.map((o) => o.id)).not.toContain('s_varek');
    expect(data.scenes['scn.m1_5.varek_talk']).toBeUndefined();
    expect(data.scenes['scn.m1_5.varek_spotted']).toBeUndefined();
    const hut = m.objects.find((o) => o.id === 'v_old')!;
    expect(hut.type).toBe('village');
    expect(hut.reward?.dialogue).toBe('scn.m1_5.watchtower_hint');
    const said = data.scenes['scn.m1_5.watchtower_hint']!.lines.map((l) => ('text' in l ? l.text : '')).join(' ');
    expect(said).toMatch(/Wachturm/);
    expect(said).toMatch(/Heerstiefeln/);
  });

  it('keeps Grosk and E3: lieutenant on the board from round 4, decision in the outro', () => {
    const grosk = data.maps[MAP]!.units.find((u) => u.id === 'grosk')!;
    expect(grosk.lieutenant).toBe('grosk');
    expect(grosk.ai).toMatchObject({ profile: 'trigger', wakeTurn: 4, then: 'aggressive' });
    expect(data.acts[1]!.nodes.find((n) => n.id === 'm1_5')!.post).toBe('scn.m1_5.outro');
    const lines = resolveScene(data, conditionContext(data, fresh('varek')), 'scn.m1_5.outro').map((l) => l.uid);
    expect(lines).toContain('c01');
    expect(lines).not.toContain('s05');
  });

  it('carries a key for each chest, a chest needs one without Fenn', () => {
    expect(keys(data.maps[MAP]!.units.find((u) => u.id === 'quartermaster')!)).toBe(chests(MAP));
  });
});

describe('N2 at the border wall', () => {
  const MAP = 'n2_wachturm';

  it('has the tower on levels: inside 1, platform 2, hill 1 with one ramp', () => {
    const s = battle('n2');
    const at = (x: number, y: number) => levelAt(data, s, [x, y]);
    expect([at(6, 2), at(9, 4), at(7, 4)]).toEqual([1, 1, 1]);
    expect(at(7, 3)).toBe(2);
    expect(tile(MAP, 7, 3)).toBe('tower_top');
    for (const [x, y] of [[7, 5], [8, 5], [7, 4]] as const) expect(tile(MAP, x, y)).toBe('stairs');
    expect(tile(MAP, 5, 3)).toBe('ladder');
    expect([at(6, 10), at(8, 11)]).toEqual([1, 1]);
    expect(tile(MAP, 7, 10)).toBe('crag');
    expect(tile(MAP, 9, 11)).toBe('ramp');
  });

  it('the hill still splits the march: no way north across it, a bow stands over the ramp', () => {
    const s = battle('n2');
    const unit = s.units.find((u) => u.id === 'lucan')!;
    expect([...reachable(data, s, unit, [7, 12], 20).keys()]).not.toContain('7,10');
    const b8 = data.maps[MAP]!.units.find((u) => u.id === 'b8')!;
    expect(b8.at).toEqual([8, 11]);
    expect(b8.class).toBe('marksman');
  });

  it('is a treasure hunt in 10 rounds for the shield and the page, with a key for every chest', () => {
    const m = data.maps[MAP]!;
    expect(m.objectives.victory).toEqual({ type: 'treasure', chests: ['c_page', 'c_relic'], turns: 10 });
    expect(m.units.reduce((n, u) => n + keys(u), 0)).toBe(chests(MAP));
    for (const id of ['sergeant', 'b1', 'b2']) expect(keys(m.units.find((u) => u.id === id)!), id).toBe(1);
    expect(m.objects.find((o) => o.id === 'c_relic')!.contents?.item?.def).toBe('pact_warden_shield');
    expect(m.objects.find((o) => o.id === 'c_page')!.contents?.chronicle).toBe('a1_watchtower');
  });

  it('only Lucan talks Varek over, across the levels, and he joins with his own gear', () => {
    const s = battle('n2', 'fenn');
    const varek = s.units.find((u) => u.id === 'varek')!;
    expect(data.maps[MAP]!.units.find((u) => u.id === 'varek')!.recruit).toEqual({ by: ['lucan'], dialogue: 'scn.n2.varek_talk' });
    expect(data.chars.varek!.joins).toBe('n2');
    expect(varek.ignoreForRout).toBe(true);
    expect(varek.equip.mainHand?.def).toBe('steel_sword');
    const lucan = s.units.find((u) => u.id === 'lucan')!;
    const other = s.units.find((u) => u.id === 'fenn')!;
    // Lucan stands on the platform (level 2), Varek on the floor (level 1)
    lucan.pos = [7, 3];
    other.pos = [8, 2];
    expect(availableActions(data, s, other, [8, 2]).some((a) => a.kind === 'talk')).toBe(false);
    const talk = availableActions(data, s, lucan, [7, 3]).find((a) => a.kind === 'talk');
    expect(talk?.targets).toEqual([varek.uid]);
    const r = applyCommand(data, s, { type: 'act', unit: lucan.uid, to: [7, 3], action: { kind: 'talk', target: varek.uid } });
    expect(r.state.units.find((u) => u.id === 'varek')!.team).toBe('player');
    expect(r.events).toContainEqual({ t: 'dialogue', id: 'scn.n2.varek_talk' });
  });

  it('Varek strikes nobody until he is talked over, and threatens no tile', () => {
    const s = battle('n2', 'fenn');
    const varek = s.units.find((u) => u.id === 'varek')!;
    const fenn = s.units.find((u) => u.id === 'fenn')!;
    fenn.pos = [8, 4];
    const hp = fenn.hp;
    expect(threatTiles(data, s, varek).size).toBe(0);
    s.units = s.units.filter((u) => u.team !== 'enemy' || u.id === 'varek');
    runAiPhase(data, s, 'enemy', []);
    expect(fenn.hp).toBe(hp);
    expect(varek.pos).toEqual([8, 3]);
  });

  it('the scene of the talk is at the wall, no word of the valley of 1-5', () => {
    const text = data.scenes['scn.n2.varek_talk']!.lines.map((l) => ('text' in l ? l.text : '')).join(' ');
    expect(text).toMatch(/Würfel/);
    expect(text).toMatch(/Dravn/);
    expect(text).not.toMatch(/Rinde|Tal\b/);
  });
});

describe('N1 on the roofs', () => {
  const MAP = 'n1_ring';

  it('is a rout, and the ring master carries a key for each chest', () => {
    const m = data.maps[MAP]!;
    expect(m.objectives.victory).toEqual({ type: 'rout' });
    const ring = m.units.find((u) => u.id === 'ring_master')!;
    expect(ring.boss).toBeUndefined();
    expect(tile(MAP, ring.at[0], ring.at[1])).toBe('roof');
    expect(keys(ring)).toBe(chests(MAP));
    expect(ring.drops).toEqual([1, 2]);
    expect(m.triggers.find((t) => t.when.type === 'unit_dies' && t.when.unit === 'ring_master')!.then).toContainEqual({ action: 'dialogue', id: 'scn.n1.ring' });
  });

  it('roofs are level 1, foot soldiers reach every block over a ladder and no other way', () => {
    const s = battle('n1', 'fenn');
    const m = data.maps[MAP]!;
    const w = m.size[0];
    const h = m.size[1];
    const unit = s.units.find((u) => u.id === 'avatar')!;
    const from = reachable(data, s, { ...unit, pos: [6, 14] }, [6, 14], 99);
    const noFoes = { ...s, units: s.units.filter((u) => u.team === 'player') };
    const walk = reachable(data, noFoes, unit, [6, 14], 99);
    expect(from.size).toBeGreaterThan(0);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (tile(MAP, x, y) !== 'roof') continue;
        expect(levelAt(data, s, [x, y])).toBe(1);
        expect(walk.has(`${x},${y}`), `${x},${y}`).toBe(true);
      }
    // from an alley beside a roof with no ladder there: no way up
    expect([...reachable(data, noFoes, unit, [0, 3], 2).keys()]).not.toContain('1,3');
  });

  it('armoured figures cannot climb; a blade below cannot strike over a ladder', () => {
    const s = battle('n1', 'fenn');
    const ladder = data.terrain.ladder!;
    expect(ladder.cost.armored).toBeNull();
    expect(ladder.cost.foot).toBe(2);
    const blade = s.units.find((u) => u.id === 't5')!;
    const top = s.units.find((u) => u.team === 'player')!;
    top.pos = [3, 3];
    blade.pos = [4, 3];
    expect(Object.keys(attackTargets(data, s, blade, [4, 3]))).not.toContain(top.uid);
  });

  it('stays playable with Fenn fallen: no forced figure missing, no defeat on the empty seat, rout still wins', () => {
    const c = fresh();
    c.fallen.push({ id: 'fenn', nameKey: 'unit.fenn.name', node: 'm1_4', classId: 'scout' });
    const s = createBattle(data, c, 'n1', c.roster.map((r) => r.id));
    expect(data.maps[MAP]!.deploy.forced).toEqual(['avatar', 'fenn']);
    expect(s.units.some((u) => u.id === 'fenn')).toBe(false);
    expect(s.units.some((u) => u.id === 'avatar' && u.pos)).toBe(true);
    expect(check(s)).toBeNull();
    // both chests stay open to the keys of the ring master, the scene speaks for the fallen
    expect(keys(data.maps[MAP]!.units.find((u) => u.id === 'ring_master')!)).toBe(2);
    for (const u of s.units) if (u.team === 'enemy') u.gone = 'dead';
    expect(check(s)).toBe('victory');
  });

  it('Fenn on the board loses the battle when he dies, and so does Lucan', () => {
    for (const id of ['fenn', 'lucan', 'avatar']) {
      const s = battle('n1', 'fenn');
      s.units.find((u) => u.id === id)!.gone = 'dead';
      expect(check(s), id).toBe('defeat');
    }
  });
});

describe('N3 on the farm', () => {
  const MAP = 'n3_erbe';

  it('stays flat', () => {
    expect(data.maps[MAP]!.levels ?? []).toEqual([]);
    const s = battle('n3');
    const [w, h] = data.maps[MAP]!.size;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) expect(levelAt(data, s, [x, y])).toBe(0);
  });

  it('defends Tobin\'s father for 8 rounds; his fall loses', () => {
    const m = data.maps[MAP]!;
    expect(m.objectives.victory).toEqual({ type: 'defend', unit: 'tobin_father', turns: 8 });
    const s = battle('n3', 'tobin');
    s.units.find((u) => u.id === 'tobin_father')!.downed = true;
    expect(check(s)).toBe('defeat');
  });

  it('stays playable with Tobin fallen: no defeat on the empty seat, the father stands, the scenes stay in mourning', () => {
    const c = fresh();
    c.roster = c.roster.filter((u) => u.id !== 'tobin');
    c.fallen.push({ id: 'tobin', nameKey: 'unit.tobin.name', node: 'm1_4', classId: 'vanguard' });
    const s = createBattle(data, c, 'n3', c.roster.map((r) => r.id));
    expect(s.units.some((u) => u.id === 'tobin')).toBe(false);
    expect(s.units.some((u) => u.id === 'tobin_father' && u.team === 'other')).toBe(true);
    expect(check(s)).toBeNull();
    const home = resolveScene(data, conditionContext(data, c), 'scn.n3.home').map((l) => l.uid);
    expect(home).toEqual(['m01']);
    expect(data.maps[MAP]!.objects.find((o) => o.id === 'v_home')!.reward?.dialogue).toBe('scn.n3.home');
    s.units.find((u) => u.id === 'tobin_father')!.downed = true;
    expect(check(s)).toBe('defeat');
  });

  it('Tobin on the board loses the battle when he dies', () => {
    const s = battle('n3', 'tobin');
    s.units.find((u) => u.id === 'tobin')!.gone = 'dead';
    expect(check(s)).toBe('defeat');
  });
});
