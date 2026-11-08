/** Story 6.11: deploy on the board. The placement rules and the battle that starts with a placement. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  addToRoster,
  applyCommand,
  autoCommand,
  benchUnit,
  createBattle,
  createHauntBattle,
  defaultPlacement,
  deployRules,
  hauntMap,
  makeHaunt,
  newCampaign,
  placeUnit,
  placementFor,
  presentForced,
  replayBattle,
  seedRng,
  startBattle,
  type CampaignState,
  type Command,
  type GameData,
  type Pos,
} from '../../src/core';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

const rules = { slots: [[0, 0], [1, 0], [2, 0], [3, 0]] as Pos[], max: 3, forced: ['a'] };

describe('placement rules', () => {
  it('the default deploy puts forced units first on the slots in their order, up to the limit', () => {
    expect(defaultPlacement(rules, ['b', 'a', 'c', 'd'])).toEqual([
      { id: 'a', at: [0, 0] },
      { id: 'b', at: [1, 0] },
      { id: 'c', at: [2, 0] },
    ]);
  });

  it('a unit on the board moves to a free slot or swaps with the one standing there', () => {
    const p = defaultPlacement(rules, ['b']);
    expect(placeUnit(rules, p, 'a', [3, 0]).placement).toEqual([
      { id: 'a', at: [3, 0] },
      { id: 'b', at: [1, 0] },
    ]);
    expect(placeUnit(rules, p, 'a', [1, 0]).placement).toEqual([
      { id: 'a', at: [1, 0] },
      { id: 'b', at: [0, 0] },
    ]);
    expect(placeUnit(rules, p, 'a', [5, 5]).blocked).toBe('slot');
  });

  it('a unit from the bench takes a free slot while places are left, else the place of a non-forced unit', () => {
    let p = defaultPlacement(rules, ['b']);
    p = placeUnit(rules, p, 'c', [2, 0]).placement;
    expect(p).toHaveLength(3);
    expect(placeUnit(rules, p, 'd', [3, 0]).blocked).toBe('full');
    expect(placeUnit(rules, p, 'd', [1, 0]).placement).toEqual([
      { id: 'a', at: [0, 0] },
      { id: 'd', at: [1, 0] },
      { id: 'c', at: [2, 0] },
    ]);
    expect(placeUnit(rules, p, 'd', [0, 0]).blocked).toBe('locked');
  });

  it('a forced unit never goes to the bench', () => {
    const p = defaultPlacement(rules, ['b']);
    expect(benchUnit(rules, p, 'a').blocked).toBe('locked');
    expect(benchUnit(rules, p, 'b').placement).toEqual([{ id: 'a', at: [0, 0] }]);
  });

  it('a placement from outside is cleaned: no foreign field, no double, the limit, forced units always there', () => {
    const known = (id: string) => id !== 'x';
    expect(
      placementFor(
        rules,
        [
          { id: 'b', at: [3, 0] },
          { id: 'x', at: [2, 0] },
          { id: 'c', at: [9, 9] },
          { id: 'd', at: [3, 0] },
          { id: 'c', at: [2, 0] },
          { id: 'e', at: [1, 0] },
        ],
        known,
      ),
    ).toEqual([
      { id: 'b', at: [3, 0] },
      { id: 'c', at: [2, 0] },
      { id: 'a', at: [0, 0] },
    ]);
  });
});

describe('a battle with a placement', () => {
  const company = (): CampaignState => {
    const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    for (const id of ['brenna', 'tobin', 'fenn']) if (!c.roster.some((u) => u.id === id)) addToRoster(data, c, id);
    return c;
  };

  it('a list of ids still gives the default deploy', () => {
    const c = company();
    const map = data.maps.m1_2_erlbach!;
    const s = createBattle(data, c, 'm1_2', c.roster.map((r) => r.id));
    const r = deployRules(map, presentForced(map, c));
    const want = defaultPlacement(r, c.roster.map((u) => u.id));
    expect(s.units.filter((u) => u.team === 'player').map((u) => ({ id: u.uid, at: u.pos }))).toEqual(want);
  });

  it('every unit starts on its chosen field and a replay of the start state gives the same battle', () => {
    const c = company();
    const slots = data.maps.m1_2_erlbach!.deploy.slots;
    const placement = [
      { id: 'lucan', at: slots[7]! },
      { id: 'avatar', at: slots[4]! },
      { id: 'fenn', at: slots[0]! },
    ];
    const start = startBattle(data, createBattle(data, c, 'm1_2', placement)).state;
    const players = start.units.filter((u) => u.team === 'player');
    expect(players.map((u) => [u.uid, u.pos])).toEqual(placement.map((p) => [p.id, p.at]));
    let s = start;
    const log: Command[] = [];
    for (let i = 0; i < 30 && !s.outcome; i++) {
      const cmd = autoCommand(data, s);
      if (!cmd) break;
      log.push(cmd);
      s = applyCommand(data, s, cmd).state;
    }
    expect(replayBattle(data, start, log)).toEqual(s);
  });

  it('a haunt starts with the placement on the fields of its anchor', () => {
    const c = company();
    c.completed = ['prologue', 'm1_1', 'm1_2'];
    c.lieutenants = { hask: { met: true, encounters: 1, grudge: 0, routs: 1, signatureDropped: false } };
    const base = data.maps.m1_2_erlbach!;
    const h = makeHaunt(data, c, base, base.haunts!.find((a) => a.variant === 'rout')!, data.lieutenants.hask!, 'h1_0', 1, seedRng(3));
    expect(h).toBeTruthy();
    c.haunts = [h!];
    const map = hauntMap(data, h!.map, h!.variant, h!.lt);
    const [first, , third] = map.deploy.slots;
    const s = createHauntBattle(data, c, h!.id, [
      { id: 'tobin', at: third! },
      { id: 'avatar', at: first! },
    ]);
    const players = s.units.filter((u) => u.team === 'player');
    expect(players.find((u) => u.uid === 'tobin')!.pos).toEqual(third);
    expect(players.find((u) => u.uid === 'avatar')!.pos).toEqual(first);
  });
});
