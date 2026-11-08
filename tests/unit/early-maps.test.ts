/** Prologue, 1-1, 1-2 and 1-3 on their accepted drafts: height where the place gives it, the quake, Mira's house, the shrine on its terrace. */
import { beforeAll, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { readFileSync } from 'node:fs';
import { firstMissionFigures } from '../../tools/build/first-mission.mjs';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  attackTargets,
  availableActions,
  beginBattle,
  levelAt,
  newCampaign,
  reachable,
  runAiPhase,
  type BattleState,
  type BattleUnit,
  type CampaignState,
  type GameData,
  type GameEvent,
} from '../../src/core';

let data: GameData;

const fresh = (seed = 7): CampaignState => newCampaign(data, seed, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
const open = (node: string): BattleState => {
  const c = fresh();
  return beginBattle(data, c, node, c.roster.map((u) => u.id)).state;
};
const at = (s: BattleState, x: number, y: number) => s.terrain[y * s.width + x];
const unit = (s: BattleState, id: string): BattleUnit => s.units.find((u) => u.id === id)!;
/** everyone but the named foes gone, so that a figure can walk freely */
const clear = (s: BattleState, ...keep: string[]) => {
  s.units = s.units.filter((u) => u.team === 'player' || keep.includes(u.id));
  return s;
};
const place = (s: BattleState, id: string, pos: [number, number]) => {
  const u = unit(s, id);
  u.pos = pos;
  u.acted = false;
  u.moved = false;
  return u;
};
const reach = (s: BattleState, u: BattleUnit, from: [number, number], mov: number) => [...reachable(data, s, u, from, mov).keys()];

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('prologue', () => {
  it('has a short rampart over the yard, reached by one stair, with one archer on it', () => {
    const s = open('prologue');
    expect([8, 9, 10].map((x) => at(s, x, 9))).toEqual(['rampart', 'rampart', 'rampart']);
    expect(at(s, 9, 10)).toBe('stairs');
    expect([levelAt(data, s, [9, 10]), levelAt(data, s, [9, 9]), levelAt(data, s, [7, 9])]).toEqual([0, 1, 0]);
    const archer = unit(s, 'tg4');
    expect(archer.classId).toBe('marksman');
    expect(archer.pos).toEqual([9, 9]);
    expect(s.units.filter((u) => u.team === 'enemy' && u.classId === 'marksman')).toHaveLength(1);
  });

  it('the archer reaches one tile farther from above, and a blade gets at him from the stair only', () => {
    const s = clear(open('prologue'), 'tg4');
    const lucan = place(s, 'lucan', [7, 8]); // 3 tiles from the rampart: the bow (range 2) carries that far only from above
    const archer = unit(s, 'tg4');
    expect(Object.keys(attackTargets(data, s, archer, [9, 9]))).toContain(lucan.uid);
    archer.pos = [9, 10];
    place(s, 'lucan', [7, 9]); // the same 3 tiles on one level
    expect(Object.keys(attackTargets(data, s, archer, [9, 10]))).not.toContain(lucan.uid);
    archer.pos = [8, 9];
    place(s, 'lucan', [8, 8]); // neighbours, but a level apart without a stair
    expect(Object.keys(attackTargets(data, s, lucan, [8, 8]))).not.toContain(archer.uid);
    archer.pos = [9, 9];
    place(s, 'lucan', [9, 10]);
    expect(Object.keys(attackTargets(data, s, lucan, [9, 10]))).toContain(archer.uid);
    archer.pos = [10, 9];
    expect(reach(s, lucan, [9, 10], 2)).toContain('9,9');
    expect(reach(s, lucan, [10, 10], 2)).not.toContain('10,9');
  });

  it('keeps the lessons of the first mission and adds the one on height', () => {
    const t = data.maps.prologue_paktnacht!.triggers;
    expect(t.find((x) => x.id === 't_intro')!.then).toEqual([{ action: 'dialogue', id: 'scn.prologue.tutorial_move' }]);
    expect(t.find((x) => x.id === 't_turn2')!.then).toEqual([{ action: 'dialogue', id: 'scn.prologue.tutorial_danger' }]);
    expect(t.find((x) => x.id === 't_heal')!.then).toEqual([{ action: 'dialogue', id: 'scn.prologue.tutorial_heal' }]);
    expect(t.find((x) => x.id === 't_height')!.then).toEqual([{ action: 'dialogue', id: 'scn.prologue.tutorial_height' }]);
    expect(data.maps.prologue_paktnacht!.noDeath).toBe(true);
  });

  const toRound3 = (s: BattleState): BattleState => {
    let cur = s;
    while (cur.turn < 3) cur = applyCommand(data, cur, { type: 'endPhase' }).state;
    return cur;
  };

  it('the door opens with Brenna’s key before the quake', () => {
    const s = clear(open('prologue'));
    const brenna = place(s, 'brenna', [2, 11]);
    expect(availableActions(data, s, brenna, [2, 11]).some((a) => a.kind === 'door' && a.object === 'd_unterstadt')).toBe(true);
    expect(at(s, 1, 11)).toBe('door');
  });

  it('the quake of round 3 opens the postern and fells four pillars', () => {
    const s = clear(open('prologue'));
    expect(at(s, 4, 6)).toBe('wall');
    const after = toRound3(s);
    expect(at(after, 1, 11)).toBe('door_open');
    expect(after.objects.find((o) => o.id === 'd_unterstadt')!.state).toBe('open');
    for (const [x, y] of [[4, 6], [9, 6], [5, 14], [8, 14]] as const) expect(at(after, x, y)).toBe('ruins');
    // the other pillars still stand, and both ways out lead to the lower town now
    expect(at(after, 4, 4)).toBe('wall');
    const brenna = place(after, 'brenna', [2, 11]);
    expect(reach(after, brenna, [2, 11], 3)).toContain('0,11');
  });

  it('needs no new figure and no later pack for the first download', () => {
    const figures = firstMissionFigures();
    expect(figures.has('bandit_archer')).toBe(false);
    expect(figures.has('temple_guard')).toBe(true);
    const packs = parse(readFileSync('content/packs.yaml', 'utf8')) as { packs: Array<{ id: string; props?: string[] }> };
    const later = packs.packs.filter((p) => p.id !== 'core').flatMap((p) => p.props ?? []);
    expect(later).not.toContain('stairs_idle');
    const legend = new Set(Object.values(data.maps.prologue_paktnacht!.legend));
    for (const id of legend) {
      const prop = data.terrain[id]?.prop;
      if (prop) expect(later, prop).not.toContain(`${prop}_idle`);
    }
  });
});

describe('1-1 Steckbriefe', () => {
  it('the city wall is a rampart with two towers; stairs lead up from the market, the rest is flat', () => {
    const s = open('m1_1');
    expect([levelAt(data, s, [8, 0]), levelAt(data, s, [4, 0]), levelAt(data, s, [12, 0]), levelAt(data, s, [7, 7]), levelAt(data, s, [7, 17])]).toEqual([1, 2, 2, 0, 0]);
    expect([at(s, 6, 1), at(s, 9, 1), at(s, 5, 0), at(s, 11, 0)]).toEqual(['stairs', 'stairs', 'stairs', 'stairs']);
    expect([levelAt(data, s, [6, 1]), levelAt(data, s, [5, 0])]).toEqual([0, 1]);
    for (const id of ['h8', 'h9']) {
      expect(unit(s, id).classId).toBe('marksman');
      expect(levelAt(data, s, unit(s, id).pos!)).toBe(2);
    }
  });

  it('a walker climbs by the stairs, not through the wall, and strikes the tower archer from the upper stair', () => {
    const s = clear(open('m1_1'), 'h8');
    const lucan = place(s, 'lucan', [6, 2]);
    expect(reach(s, lucan, [6, 2], 3)).toEqual(expect.arrayContaining(['6,1', '6,0', '5,0']));
    expect(reach(s, lucan, [3, 1], 4)).not.toContain('3,0');
    const archer = unit(s, 'h8');
    expect(Object.keys(attackTargets(data, s, lucan, [5, 0]))).toContain(archer.uid);
  });

  it('keeps the triangle lesson and the posters, Fenn joins by the node, the rumour lies in the merchant’s house', () => {
    const map = data.maps.m1_1_steckbriefe!;
    const ids = map.triggers.map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(['t_intro_triangle', 't_posters']));
    expect(map.units.some((u) => u.id === 'fenn')).toBe(false);
    expect(data.acts[1]!.nodes.find((n) => n.id === 'm1_1')!.effects).toContainEqual({ recruit: 'fenn' });
    const rumor = map.objects.find((o) => o.id === 'v_rumor')!;
    expect(rumor.at).toEqual([1, 6]);
    expect(rumor.reward?.dialogue).toBe('scn.m1_1.kharesh_rumor');
    expect(map.objects.filter((o) => o.type === 'village')).toHaveLength(5);
  });
});

describe('1-2 Erlbach', () => {
  it('stays flat', () => {
    const s = open('m1_2');
    expect(data.maps.m1_2_erlbach!.levels ?? []).toEqual([]);
    for (let y = 0; y < s.height; y++) for (let x = 0; x < s.width; x++) expect(levelAt(data, s, [x, y])).toBe(0);
  });

  it('Mira’s house is the hut on the east edge, in reach from the deploy area in round 2', () => {
    const map = data.maps.m1_2_erlbach!;
    const house = map.objects.find((o) => o.id === 'v_e')!;
    expect(house.reward?.recruit).toBe('mira');
    expect(house.at).toEqual([17, 8]);
    const s = clear(open('m1_2'));
    const walker = s.units.find((u) => u.team === 'player' && u.id !== 'avatar')!;
    const slot = map.deploy.slots[3]! as [number, number];
    const first = reachable(data, s, walker, slot);
    const second = [...first.keys()].some((k) => {
      const [x, y] = k.split(',').map(Number) as [number, number];
      return [...reachable(data, s, walker, [x, y]).keys()].includes('17,8');
    });
    expect(second).toBe(true);
  });

  it('no raider razes it before round 4; if one does, the flag is set and Mira does not join', () => {
    let s = open('m1_2');
    // a company that does nothing: it stands far off and only the foes move
    const house = () => s.objects.find((o) => o.id === 'v_e')!;
    let razedAt = 0;
    for (let turn = 1; turn <= 8 && !razedAt; turn++) {
      s = applyCommand(data, s, { type: 'endPhase' }).state;
      if (house().state === 'razed') razedAt = turn;
      if (s.outcome) break;
    }
    if (razedAt) {
      expect(razedAt).toBeGreaterThanOrEqual(4);
      expect(s.flags).toContain('mira_house_razed');
    }
    const node = data.acts[1]!.nodes.find((n) => n.id === 'm1_2')!;
    expect(node.effectsIf).toEqual([{ requires: [{ not: { flag: 'mira_house_razed' } }], effects: [{ recruit: 'mira' }] }]);
    expect(data.maps.m1_2_erlbach!.units.some((u) => u.ai?.profile === 'raider' && u.ai.target === 'v_e')).toBe(true);
  });

  it('a raider standing on the house razes it and the trigger sets the flag', () => {
    const s = clear(open('m1_2'), 'r8');
    for (const u of s.units) if (u.team === 'player') u.pos = [0, 0];
    place(s, 'r8', [17, 8]);
    s.phase = 'enemy';
    const events: never[] = [];
    runAiPhase(data, s, 'enemy', events);
    expect(s.objects.find((o) => o.id === 'v_e')!.state).toBe('razed');
    expect(s.flags).toContain('mira_house_razed');
  });

  it('keeps Hask and his line, and the elder to protect', () => {
    const map = data.maps.m1_2_erlbach!;
    expect(map.objectives.victory).toEqual({ type: 'defend', unit: 'elder', turns: 8 });
    const hask = map.units.find((u) => u.id === 'hask')!;
    expect(hask.lieutenant).toBe('hask');
    expect(hask.quote).toBe('scn.m1_2.hask_battle');
  });
});

describe('1-3 the shrine at the hawthorn', () => {
  it('the goal is to reach the shrine, up on a terrace; only the ramp leads there', () => {
    const map = data.maps.m1_3_silberbach!;
    expect(map.objectives.victory).toEqual({ type: 'reach', unit: 'avatar', area: { rect: [8, 1, 11, 2] } });
    const s = clear(open('m1_3'));
    for (const [x, y] of [[8, 1], [11, 2], [9, 2]] as const) expect(levelAt(data, s, [x, y])).toBe(1);
    expect(levelAt(data, s, [9, 3])).toBe(0);
    expect([at(s, 9, 3), at(s, 10, 3), at(s, 9, 1), at(s, 10, 1)]).toEqual(['ramp', 'ramp', 'shrine', 'shrine']);
    const lucan = place(s, 'lucan', [9, 4]);
    expect(reach(s, lucan, [9, 4], 3)).toContain('9,2');
    expect(reach(s, lucan, [7, 3], 2)).not.toContain('7,2');
  });

  it('the rest of the forest is flat', () => {
    const s = open('m1_3');
    for (let y = 3; y < s.height; y++) for (let x = 0; x < s.width; x++) expect(levelAt(data, s, [x, y])).toBe(0);
  });

  it('Morra’s archers stand above the ramp, Halvard cannot be struck, Liora waits as third party and must not fall', () => {
    const map = data.maps.m1_3_silberbach!;
    const s = open('m1_3');
    for (const id of ['m1', 'm2']) {
      expect(unit(s, id).classId).toBe('marksman');
      expect(levelAt(data, s, unit(s, id).pos!)).toBe(1);
    }
    expect(unit(s, 'halvard').untargetable).toBe(true);
    expect(unit(s, 'liora').team).toBe('other');
    expect(map.objectives.defeat).toContainEqual({ type: 'unit_dies', unit: 'liora' });
    const morra = map.units.find((u) => u.id === 'morra')!;
    expect(morra.lieutenant).toBe('morra');
    expect(morra.quote).toBe('scn.m1_3.morra_battle');
    expect(map.fog).toBe(true);
  });

  // fix 1-3: Morra struck Liora first and fell to her counter before the company met her; `ai.prefer: player` keeps her on the company
  const morraAwake = (s: BattleState) => {
    const morra = unit(s, 'morra');
    morra.ai = { ...morra.ai!, profile: 'aggressive', awake: true };
    return morra;
  };
  const enemyPhase = (s: BattleState) => {
    const events: GameEvent[] = [];
    runAiPhase(data, s, 'enemy', events);
    return events.filter((e) => e.t === 'combat');
  };

  it('Morra strikes the company, not Liora, when both stand in her reach', () => {
    const s = clear(open('m1_3'), 'morra', 'liora', 'halvard');
    expect(data.maps.m1_3_silberbach!.units.find((u) => u.id === 'morra')!.ai).toMatchObject({ prefer: 'player' });
    morraAwake(s);
    place(s, 'liora', [10, 8]);
    const lucan = place(s, 'lucan', [12, 6]);
    expect(enemyPhase(s)).toEqual([expect.objectContaining({ attacker: unit(s, 'morra').uid, defender: lucan.uid })]);
  });

  it('with only Liora in reach Morra leaves her alone and closes in on the company', () => {
    const s = clear(open('m1_3'), 'morra', 'liora', 'halvard');
    const morra = morraAwake(s);
    place(s, 'liora', [10, 8]);
    const y0 = morra.pos![1];
    expect(enemyPhase(s)).toEqual([]);
    expect(morra.pos![1]).toBeGreaterThan(y0);
  });

  it('without the preference she would go for Liora (the field is what keeps her off)', () => {
    const s = clear(open('m1_3'), 'morra', 'liora', 'halvard');
    const morra = morraAwake(s);
    morra.ai!.prefer = undefined;
    const liora = place(s, 'liora', [10, 8]);
    expect(enemyPhase(s)).toEqual([expect.objectContaining({ attacker: morra.uid, defender: liora.uid })]);
  });
});
