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
  newCampaign,
  ruleOn,
  nextFloat,
  reachable,
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
    expect(start.units.some((u) => u.id === 'grosk' && u.boss)).toBe(true);
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
    expect(c.available).toEqual(['ch01']);
    expect(c.gold).toBeGreaterThan(campaign.gold);
  });
});

describe('step-by-step mechanics (concept/06 §10)', () => {
  it('unlocks the triangle in chapter 1 and magic in chapter 2', () => {
    expect(lockedMechanics(data, 'prologue')).toEqual(expect.arrayContaining(['triangle', 'magic', 'elements', 'supports']));
    expect(lockedMechanics(data, 'ch01')).not.toContain('triangle');
    expect(lockedMechanics(data, 'ch01')).toContain('magic');
    expect(lockedMechanics(data, 'ch02')).not.toContain('magic');
    expect(lockedMechanics(data, 'ch02')).toContain('elements');
  });
  it('ignores the triangle while it is locked, in forecast and resolution alike', () => {
    const s = beginBattle(data, campaign, 'prologue', campaign.roster.map((u) => u.id)).state;
    expect(ruleOn(s, 'triangle')).toBe(false);
    const kael = getUnit(s, 'kael');
    const foe = s.units.find((u) => u.id === 'p_e1')!;
    const near = { ...s, units: s.units.map((u) => (u.uid === foe.uid ? { ...u, pos: [kael.pos![0], kael.pos![1] - 1] as [number, number] } : u)) };
    expect(forecast(data, near, 'kael', foe.uid).attacker.triangle).toBe(0);
    expect(forecast(data, { ...near, locked: [] }, 'kael', foe.uid).attacker.triangle).toBe(1);
  });
  it('places units and reinforcements per difficulty', () => {
    const at = (d: 'easy' | 'normal' | 'hard') =>
      beginBattle(data, { ...campaign, settings: { ...campaign.settings, difficulty: d } }, 'prologue', campaign.roster.map((u) => u.id)).state;
    const foes = (s: BattleState) => s.units.filter((u) => u.team === 'enemy').length;
    expect(foes(at('easy'))).toBeLessThan(foes(at('normal')));
    expect(foes(at('normal'))).toBeLessThan(foes(at('hard')));
  });
  it('hands the avatar a tome after chapter 1', () => {
    expect(campaign.roster.find((u) => u.id === 'avatar')!.equip.mainHand?.def).toBe('iron_sword');
    let c = campaign;
    for (const node of ['prologue', 'ch01']) {
      const { state } = autoplay(data, beginBattle(data, c, node, c.roster.map((u) => u.id)).state);
      expect(state.outcome).toBe('victory');
      const r = finishBattle(data, c, state);
      c = r.campaign;
      if (node === 'ch01') expect(r.result.granted.map((g) => g.item.def)).toEqual(['ember']);
    }
    const avatar = c.roster.find((u) => u.id === 'avatar')!;
    expect([avatar.equip.mainHand, avatar.equip.offHand, ...avatar.bag, ...c.convoy].some((i) => i?.def === 'ember')).toBe(true);
  });
});
