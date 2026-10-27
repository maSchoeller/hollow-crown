import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import {
  applyCommand,
  autoplay,
  beginBattle,
  computeStats,
  elementMultiplier,
  finishBattle,
  forecast,
  getUnit,
  levelUp,
  lockedMechanics,
  availableNodes,
  newCampaign,
  ruleOn,
  nextFloat,
  reachable,
  sideObjectiveDone,
  sideObjectiveProgress,
  seedRng,
  triangleOf,
  weaponProfile,
  type BattleState,
  type CampaignState,
  type GameData,
} from '../../src/core';

let data: GameData;
let campaign: CampaignState;

beforeAll(() => {
  const loaded = loadContentFromDisk();
  expect(loaded.issues).toEqual([]);
  expect(validateContent(loaded.data, loaded.locales)).toEqual([]);
  data = loaded.data;
  campaign = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, {
    name: 'Rhen',
    pronoun: 'they',
    portrait: 'avatar_a',
    affinity: 'wind',
  });
});

describe('place images and recruit dialogues', () => {
  const msgs = (d: GameData, places?: Set<string>) => validateContent(d, loadContentFromDisk().locales, undefined, undefined, places).map((i) => `${i.file}: ${i.message}`);
  const places = () => new Set([data.campaign.defaultPlace, ...Object.values(data.home).map((h) => h.image), ...data.campaign.nodes.flatMap((n) => (n.place ? [n.place] : [])),
    ...Object.values(data.scenes).flatMap((sc) => [...(sc.background ? [sc.background] : []), ...sc.lines.flatMap((l) => ('panel' in l && l.panel && l.panel !== 'none' ? [l.panel] : []))])]);
  it('accepts the shipped places', () => {
    expect(msgs(data, places())).toEqual([]);
  });
  it('reports a node place and a default place without an image', () => {
    const d = structuredClone(data);
    d.campaign.nodes[0]!.place = 'nowhere';
    d.campaign.defaultPlace = 'also_nowhere';
    const out = msgs(d, places().add('lager_unterwegs'));
    expect(out).toContain('campaign.yaml: prologue place: no place image art/mockups/locations-s1/nowhere.png');
    expect(out).toContain('campaign.yaml: defaultPlace: no place image art/mockups/locations-s1/also_nowhere.png');
  });
  it('reports a character recruit dialogue that is no scene', () => {
    const d = structuredClone(data);
    d.chars.liora!.recruit = { chapter: 'm1_3', by: 'any', dialogue: 'scn.ghost' };
    expect(msgs(d)).toContainEqual(expect.stringContaining('liora recruit.dialogue: unknown scene scn.ghost'));
  });
});

describe('place images of campaign nodes (story 7.6) and scene backdrops (story 8.7)', () => {
  const run = (place: string) => {
    const loaded = loadContentFromDisk();
    loaded.data.campaign.nodes[0]!.place = place;
    return validateContent(loaded.data, loaded.locales, undefined, undefined, new Set(['varnhold', 'erlbach', 'lager_unterwegs', 'paktwacht_ruine', 'paktnacht_glutdom', 'silberbach', 'wolfslager', 'hungerlager', 'rhen_confession'])).map((i) => `${i.file}: ${i.message}`);
  };
  it('accepts a location as place', () => {
    expect(run('varnhold')).toEqual([]);
  });
  it('reports a missing location', () => {
    expect(run('nowhere')).toContain('campaign.yaml: prologue place: no place image art/mockups/locations-s1/nowhere.png');
  });
  it('reports a scene backdrop without a place image', () => {
    const loaded = loadContentFromDisk();
    loaded.data.scenes['scn.m1_2.intro']!.background = 'nowhere';
    const out = validateContent(loaded.data, loaded.locales, undefined, undefined, new Set(['varnhold', 'erlbach', 'lager_unterwegs', 'paktnacht_glutdom'])).map((i) => `${i.file}: ${i.message}`);
    expect(out).toContain('scenes/scn.m1_2.intro: background: no place image art/mockups/locations-s1/nowhere.png');
  });
  it('the shipped missions use the places of their chapters', () => {
    const loaded = loadContentFromDisk();
    const places = Object.fromEntries(loaded.data.campaign.nodes.map((n) => [n.id, n.place]));
    expect(places).toEqual({ prologue: 'paktnacht_glutdom', m1_1: 'varnhold', m1_2: 'erlbach', m1_3: 'silberbach', m1_4: 'wolfslager', m1_5: 'hungerlager' });
  });
});

describe('item images (story 8.5)', () => {
  const images = () => new Set(Object.values(data.items).map((i) => i.image ?? i.id));
  it('accepts content where every item and rune has its image', () => {
    const loaded = loadContentFromDisk();
    expect(validateContent(loaded.data, loaded.locales, undefined, images())).toEqual([]);
  });
  it('reports an item and a rune without image', () => {
    const loaded = loadContentFromDisk();
    const set = images();
    set.delete('iron_sword');
    set.delete('fire_rune');
    const msgs = validateContent(loaded.data, loaded.locales, undefined, set).map((i) => `${i.file}: ${i.message}`);
    expect(msgs).toContain('items.yaml: iron_sword: no image art/items/iron_sword.png');
    expect(msgs).toContain('runes.yaml: fire_rune_2: no image art/items/fire_rune.png');
  });
  it('tiered runes share the image of their element', () => {
    expect(data.items.fire_rune_3!.image).toBe('fire_rune');
    expect(data.runes.dark_rune_1!.image).toBe('dark_rune');
  });
});

describe('rng', () => {
  it('is deterministic per seed', () => {
    const a = seedRng(42);
    const b = seedRng(42);
    const xs = Array.from({ length: 5 }, () => nextFloat(a));
    const ys = Array.from({ length: 5 }, () => nextFloat(b));
    expect(xs).toEqual(ys);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(seedRng(1)).not.toEqual(seedRng(2));
  });
});

describe('side objective progress (story 2.1)', () => {
  it('counts villages for the HUD pill and agrees with the done check', () => {
    const s = beginBattle(data, campaign, 'm1_2', campaign.roster.map((u) => u.id)).state;
    const o = data.maps[s.mapId]!.objectives.side.find((x) => x.type === 'visit_villages')!;
    expect(sideObjectiveProgress(data, s, o)).toEqual({ have: 0, total: 5 });
    expect(sideObjectiveDone(data, s, o)).toBe(false);
    s.stats.villagesVisited.push('v_elder', 'v_n1', 'v_n2', 'v_w', 'v_e');
    expect(sideObjectiveProgress(data, s, o)).toEqual({ have: 5, total: 5 });
    expect(sideObjectiveDone(data, s, o)).toBe(true);
  });
  it('has no count for objectives that are not about counting', () => {
    const s = beginBattle(data, campaign, 'm1_1', campaign.roster.map((u) => u.id)).state;
    const o = data.maps[s.mapId]!.objectives.side.find((x) => x.type === 'turn_limit')!;
    expect(sideObjectiveProgress(data, s, o)).toBeUndefined();
  });
});

describe('triangle and elements', () => {
  it('sword beats axe, axe beats lance, lance beats sword', () => {
    const p = (id: string) => weaponProfile(data, { uid: 'x', def: id, upgrade: 0, affixes: [], runes: [] });
    expect(triangleOf(data, p('iron_sword'), p('iron_axe'))).toBe(1);
    expect(triangleOf(data, p('iron_axe'), p('iron_lance'))).toBe(1);
    expect(triangleOf(data, p('iron_lance'), p('iron_sword'))).toBe(1);
    expect(triangleOf(data, p('iron_axe'), p('iron_sword'))).toBe(-1);
    expect(triangleOf(data, p('iron_bow'), p('iron_sword'))).toBe(0);
  });
  it('element circle and light/dark', () => {
    expect(elementMultiplier(data, 'fire', 'wind', [])).toBe(1.2);
    expect(elementMultiplier(data, 'fire', 'water', [])).toBe(0.8);
    expect(elementMultiplier(data, 'fire', 'fire', [])).toBe(0.8);
    expect(elementMultiplier(data, 'light', 'dark', [])).toBe(1.2);
    expect(elementMultiplier(data, 'dark', 'light', [])).toBe(1.2);
    expect(elementMultiplier(data, 'dark', undefined, ['holy'])).toBe(1.2);
    expect(elementMultiplier(data, undefined, 'fire', [])).toBe(1);
  });
  it('fire rune III adds element, status chance and ignite', () => {
    const w = weaponProfile(data, { uid: 'x', def: 'iron_sword', upgrade: 2, affixes: [], runes: ['fire_rune_3'] });
    expect(w.element).toBe('fire');
    expect(w.might).toBe(5 + 2);
    expect(w.hit).toBe(90 + 6);
    expect(w.statusOnHit).toContainEqual({ status: 'burning', chance: 50 });
    expect(w.terrainOnHit).toBe('ignite');
  });
});

describe('stats and weight', () => {
  it('overload reduces attack speed (concept/13 acceptance 4)', () => {
    const brenna = structuredClone(campaign.roster.find((u) => u.id === 'brenna')!);
    const before = computeStats(data, brenna);
    brenna.equip.mainHand = { uid: 'sa', def: 'steel_axe', upgrade: 0, affixes: [], runes: [] };
    brenna.equip.body = { uid: 'pa', def: 'plate_armor', upgrade: 0, affixes: [], runes: [] };
    const after = computeStats(data, brenna);
    expect(after.load).toBeGreaterThan(before.load);
    expect(after.overload).toBe(Math.max(0, after.load - after.carry));
    expect(after.as).toBe(after.stats.spd - after.overload);
    expect(after.as).toBeLessThan(before.as);
  });
});

describe('level up smoothing', () => {
  it('stays close to the expected growth over many levels', () => {
    const u = structuredClone(campaign.roster.find((r) => r.id === 'kael')!);
    const rng = seedRng(3);
    const start = { ...u.stats };
    for (let i = 0; i < 15; i++) levelUp(data, u, rng);
    for (const k of ['hp', 'str', 'skl', 'spd'] as const) {
      const gained = u.stats[k] - start[k];
      expect(Math.abs(gained - u.expected[k])).toBeLessThanOrEqual(1.5);
    }
  });
});

describe('battle', () => {
  let start: BattleState;
  beforeAll(() => {
    start = beginBattle(data, campaign, 'prologue', campaign.roster.map((u) => u.id)).state;
  });
  it('creates the prologue with deployed units and enemies', () => {
    expect(start.units.filter((u) => u.team === 'player')).toHaveLength(4);
    expect(start.units.filter((u) => u.team === 'enemy').every((u) => u.nameKey === 'unit.temple_guard.name' && !u.boss && !u.lieutenant)).toBe(true);
    expect(start.phase).toBe('player');
  });
  it('movement range respects terrain and units', () => {
    const kael = getUnit(start, 'kael');
    const reach = reachable(data, start, kael);
    expect(reach.size).toBeGreaterThan(5);
    // wagons are impassable for foot units
    for (const k of reach.keys()) expect(start.terrain[Number(k.split(',')[1]) * start.width + Number(k.split(',')[0])]).not.toBe('wagon');
  });
  it('forecast equals resolution numbers', () => {
    let s = start;
    // walk Kael next to a bandit via autoplay until an attack happens, then compare the forecast
    for (let i = 0; i < 200; i++) {
      const kael = getUnit(s, 'kael');
      const foe = s.units.find((u) => u.team === 'enemy' && u.pos && !u.gone && Math.abs(u.pos[0] - kael.pos![0]) + Math.abs(u.pos[1] - kael.pos![1]) === 1);
      if (foe && !kael.acted) {
        const f = forecast(data, s, 'kael', foe.uid);
        const r = applyCommand(data, s, { type: 'act', unit: 'kael', to: kael.pos!, action: { kind: 'attack', target: foe.uid } });
        const strikes = r.events.filter((e) => e.t === 'strike' && e.attacker === 'kael' && e.hit && !e.crit);
        for (const e of strikes) if (e.t === 'strike') expect(e.dmg).toBe(f.attacker.damage);
        return;
      }
      const r = applyCommand(data, s, s.phase === 'player' && !kael.acted ? { type: 'act', unit: 'kael', to: kael.pos!, action: { kind: 'wait' } } : { type: 'endPhase' });
      s = r.state;
      if (s.outcome) break;
    }
  });
  it('replays deterministically (concept/13 acceptance 10)', () => {
    const a = autoplay(data, start);
    let s = start;
    for (const cmd of a.log) s = applyCommand(data, s, cmd).state;
    expect(JSON.stringify(s)).toBe(JSON.stringify(a.state));
    expect(a.state.outcome).toBe('victory');
  });
  it('finishing a victory advances the campaign', () => {
    const { state } = autoplay(data, start);
    const { campaign: c, result } = finishBattle(data, campaign, state);
    expect(result.outcome).toBe('victory');
    expect(c.completed).toContain('prologue');
    expect(availableNodes(data, c).map((n) => n.id)).toEqual(['m1_1']);
    expect(c.gold).toBeGreaterThan(campaign.gold);
  });
});

describe('step-by-step mechanics (concept/06 §10)', () => {
  it('unlocks the triangle after 1 story mission and magic after 2', () => {
    const at = (...completed: string[]) => lockedMechanics(data, { ...campaign, completed });
    expect(at()).toEqual(expect.arrayContaining(['triangle', 'magic', 'elements', 'supports']));
    expect(at('prologue')).not.toContain('triangle');
    expect(at('prologue')).toContain('magic');
    expect(at('prologue', 'm1_1')).not.toContain('magic');
    expect(at('prologue', 'm1_1')).toContain('elements');
  });
  it('ignores the triangle while it is locked, in forecast and resolution alike', () => {
    const s = beginBattle(data, campaign, 'prologue', campaign.roster.map((u) => u.id)).state;
    expect(ruleOn(s, 'triangle')).toBe(false);
    const kael = getUnit(s, 'kael');
    const foe = s.units.find((u) => u.id === 'tg2')!; // lance guard: sword (Kael) loses against lance
    const near = { ...s, units: s.units.map((u) => (u.uid === foe.uid ? { ...u, pos: [kael.pos![0], kael.pos![1] - 1] as [number, number] } : u)) };
    expect(forecast(data, near, 'kael', foe.uid).attacker.triangle).toBe(0);
    expect(forecast(data, { ...near, locked: [] }, 'kael', foe.uid).attacker.triangle).toBe(-1);
  });
  it('places units and reinforcements per difficulty', () => {
    const at = (d: 'easy' | 'normal' | 'hard') =>
      beginBattle(data, { ...campaign, settings: { ...campaign.settings, difficulty: d } }, 'prologue', campaign.roster.map((u) => u.id)).state;
    const foes = (s: BattleState) => s.units.filter((u) => u.team === 'enemy').length;
    // Product owner 2026-10-24: easy 4, normal 5, hard 6 temple guards, and Hard adds the announced side-gate reinforcement in round 3.
    expect([foes(at('easy')), foes(at('normal')), foes(at('hard'))]).toEqual([4, 5, 6]);
    expect(data.maps.prologue_paktnacht!.reinforcements[0]!.units.some((u) => u.difficulty?.includes('hard') && !u.difficulty.includes('normal'))).toBe(true);
  });
  it('hands the avatar a tome after the second story mission', () => {
    expect(campaign.roster.find((u) => u.id === 'avatar')!.equip.mainHand?.def).toBe('iron_sword');
    // easy difficulty and the first seed whose chain autoplay wins: the test is about the node grants, not the combat
    const chain = (seed: number) => {
      let c = newCampaign(data, seed, { difficulty: 'easy', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
      let granted: string[] = [];
      for (const node of ['prologue', 'm1_1']) {
        const { state } = autoplay(data, beginBattle(data, c, node, c.roster.map((u) => u.id)).state);
        if (state.outcome !== 'victory') return null;
        const r = finishBattle(data, c, state);
        c = r.campaign;
        if (node === 'm1_1') granted = r.result.granted.map((g) => g.item.def);
      }
      return { c, granted };
    };
    let won: ReturnType<typeof chain> = null;
    for (let seed = 1; seed < 12 && !won; seed++) won = chain(seed);
    expect(won).not.toBeNull();
    expect(won!.granted).toEqual(['ember']);
    const avatar = won!.c.roster.find((u) => u.id === 'avatar')!;
    expect([avatar.equip.mainHand, avatar.equip.offHand, ...avatar.bag, ...won!.c.convoy].some((i) => i?.def === 'ember')).toBe(true);
  });
});
