import { describe, expect, it } from 'vitest';
import {
  applyCampaign,
  applyCommand,
  autoplay,
  createBattle,
  createHauntBattle,
  expPercent,
  finishBattle,
  grantExp,
  hauntGold,
  hauntMapId,
  makeHaunt,
  newCampaign,
  seedRng,
  startBattle,
  validateCampaign,
  type BattleState,
  type CampaignState,
  type GameData,
  type HauntVariant,
} from '../../src/core';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';

const { data, locales } = loadContentFromDisk();
const HASK = { met: true, encounters: 1, grudge: 0, routs: 1, signatureDropped: false };

/** A treasure anchor on 1-1 so that all five variants are in the test (no shipped map has one yet). */
function withTreasure(): GameData {
  const base = data.maps.m1_1_steckbriefe!;
  const m = { ...structuredClone(base), haunts: [...base.haunts!, { variant: 'treasure' as const, target: { at: [6, 1] as [number, number] }, enemySpawn: { rect: [3, 2, 10, 3] as [number, number, number, number] }, deploy: { rect: [5, 13, 8, 14] as [number, number, number, number] }, turns: 10, chests: [[2, 3], [11, 3]] as Array<[number, number]> }] };
  return { ...data, maps: { ...data.maps, m1_1_steckbriefe: m } };
}

function campaignWith(d: GameData, map: string, variant: HauntVariant, opts: { seed?: number; since?: number; difficulty?: 'easy' | 'normal' | 'hard' } = {}): CampaignState {
  const c = newCampaign(d, opts.seed ?? 7, { difficulty: opts.difficulty ?? 'normal', deathMode: 'standard' } as never, { name: 'Rhen', portrait: 'avatar_a' } as never);
  c.completed = ['prologue', 'm1_1'];
  c.lieutenants = { hask: { ...HASK } };
  c.hauntsSinceStory = opts.since ?? 0;
  const anchor = d.maps[map]!.haunts!.find((a) => a.variant === variant)!;
  const h = makeHaunt(d, c, d.maps[map]!, anchor, d.lieutenants.hask!, 'h1_0', 1, seedRng(3))!;
  c.haunts = [h];
  return c;
}

const ANCHORS: Array<[string, HauntVariant]> = [
  ['prologue_paktnacht', 'rout'],
  ['prologue_paktnacht', 'boss'],
  ['prologue_paktnacht', 'defend'],
  ['m1_1_steckbriefe', 'defend'],
  ['m1_1_steckbriefe', 'boss'],
  ['m1_1_steckbriefe', 'escort'],
  ['m1_1_steckbriefe', 'treasure'],
];

describe('haunt battle (story 5.6)', () => {
  const d = withTreasure();

  it.each(ANCHORS)('%s %s builds a valid battle that plays to an end', (map, variant) => {
    const c = campaignWith(d, map, variant);
    const h = c.haunts[0]!;
    const s = createHauntBattle(d, c, h.id, c.roster.map((u) => u.id));
    const v = d.maps[s.mapId]!.objectives.victory;
    expect(s.hauntId).toBe(h.id);
    expect(s.mapId).toBe(hauntMapId(map, variant, 'hask'));
    expect(v.type).toBe({ boss: 'boss', rout: 'rout', defend: 'defend', escort: 'escort', treasure: 'treasure' }[variant]);
    // the company stands on the anchor's deploy fields, the enemies where they were made
    const anchor = d.maps[map]!.haunts!.find((a) => a.variant === variant)!;
    expect(s.units.filter((u) => u.team === 'player').length).toBeGreaterThan(0);
    for (const e of h.enemies) expect(s.units.some((u) => u.team === 'enemy' && `${u.pos}` === `${e.at}`)).toBe(true);
    expect(s.units.filter((u) => u.team === 'enemy').length).toBe(h.enemies.length);
    const lt = s.units.find((u) => u.lieutenant === 'hask')!;
    expect(lt.id).toBe('hask');
    expect(lt.equip.mainHand).toBeTruthy(); // the kit comes from the lieutenant's story map
    expect(s.lieutenantPlan?.hask).toBeTruthy();
    const civ = s.units.find((u) => u.id === 'civilian');
    expect(!!civ).toBe(variant === 'defend' || variant === 'escort');
    if (civ) expect(`${civ.pos}`).toBe(`${anchor.target.at}`);
    if (variant === 'treasure') expect(s.objects.filter((o) => o.type === 'chest').length).toBe(2);
    const played = autoplay(d, startBattle(d, s).state);
    expect(played.state.outcome ?? 'timeout').not.toBe('timeout');
  });

  it('is the same battle from the same start (determinism) and replays to the same result', () => {
    const c = campaignWith(d, 'm1_1_steckbriefe', 'boss');
    const ids = c.roster.map((u) => u.id);
    const a = createHauntBattle(d, c, 'h1_0', ids);
    const b = createHauntBattle(d, c, 'h1_0', ids);
    expect(a).toEqual(b);
    const r1 = autoplay(d, startBattle(d, a).state);
    const r2 = autoplay(d, startBattle(d, b).state);
    expect(r1.state).toEqual(r2.state);
    let replay = startBattle(d, a).state;
    for (const cmd of r1.log) replay = applyCommand(d, replay, cmd).state;
    expect(replay).toEqual(r1.state);
    // another haunt id gives another battle seed
    const other = { ...c, haunts: [{ ...c.haunts[0]!, id: 'h2_0' }] };
    expect(createHauntBattle(d, other, 'h2_0', ids).rng).not.toEqual(a.rng);
  });

  it('finds its map again from the id (core worker, restored save)', () => {
    const c = campaignWith(d, 'prologue_paktnacht', 'defend');
    const s = createHauntBattle(d, c, 'h1_0', c.roster.map((u) => u.id));
    const fresh = loadContentFromDisk().data;
    expect(fresh.maps[s.mapId]).toBeUndefined();
    const r = applyCommand(fresh, startBattle(d, s).state, { type: 'endPhase' });
    expect(fresh.maps[s.mapId]?.objectives.victory.type).toBe('defend');
    expect(r.state.turn).toBeGreaterThanOrEqual(1);
  });

  it('keeps the lieutenant scaled by his grudge, like on a story map', () => {
    const c = campaignWith(d, 'prologue_paktnacht', 'rout');
    c.lieutenants = { hask: { ...HASK, grudge: 2, target: 'avatar' } };
    const s = createHauntBattle(d, c, 'h1_0', c.roster.map((u) => u.id));
    const lt = s.units.find((u) => u.lieutenant === 'hask')!;
    expect(lt.grudge).toBe(2);
    expect(lt.grudgeTarget).toBe('avatar');
    expect(lt.mastered.length).toBeGreaterThan(0);
  });

  it('a lieutenant who joined stays off the board', () => {
    const c = campaignWith(d, 'prologue_paktnacht', 'rout');
    c.flags.joined_hask = true;
    const s = createHauntBattle(d, c, 'h1_0', c.roster.map((u) => u.id));
    expect(s.units.some((u) => u.lieutenant)).toBe(false);
  });

  it('gives a treasure hunt without a scout one key per chest', () => {
    const c = campaignWith(d, 'm1_1_steckbriefe', 'treasure');
    c.roster = c.roster.filter((r) => d.classes[r.classId]!.classAction?.id !== 'open_steal');
    const s = createHauntBattle(d, c, 'h1_0', c.roster.map((u) => u.id));
    const keys = s.units.filter((u) => u.team === 'player').flatMap((u) => u.bag).filter((i) => i.def === 'door_key');
    expect(keys.length).toBe(2);
  });
});

/** A won battle without playing it: the rules of the result only look at the outcome and the units. */
function won(s: BattleState): BattleState {
  return { ...s, outcome: 'victory' };
}

describe('haunt reward (story 5.6)', () => {
  const ids = (c: CampaignState) => c.roster.map((u) => u.id);
  const mean = () => {
    const maps = data.campaign.nodes.filter((n) => n.kind === 'story').map((n) => data.maps[n.map]!.goldReward);
    return maps.reduce((a, b) => a + b, 0) / maps.length;
  };
  const win = (c: CampaignState, h = c.haunts[0]!) => finishBattle(data, c, won(createHauntBattle(data, c, h.id, ids(c))));

  it('pays haunt.goldPct of the mean story gold and a share of the act material, never anything else', () => {
    expect(data.balance.haunt.goldPct).toBe(40);
    const c = campaignWith(data, 'prologue_paktnacht', 'rout');
    const { campaign, result } = win(c);
    const base = Math.round(mean() * 0.4);
    expect(hauntGold(data)).toBe(base);
    expect(result.gold).toBe(base);
    expect(campaign.gold).toBe(c.gold + base);
    const ore = (campaign.materials.iron_ore ?? 0) - (c.materials.iron_ore ?? 0);
    expect(ore).toBeGreaterThanOrEqual(data.balance.haunt.material.min);
    expect(ore).toBeLessThanOrEqual(data.balance.haunt.material.max);
    // no other currency or material; the story node is untouched
    expect(Object.keys(campaign.materials)).toEqual(['iron_ore']);
    expect(result.items).toEqual([]);
    expect(result.granted).toEqual([]);
    expect(result.side).toEqual([]);
  });

  it('halves gold from the 4th haunt since the last story mission', () => {
    const base = hauntGold(data);
    for (const [since, gold, halved] of [[0, base, false], [1, base, false], [2, base, false], [3, Math.round(base / 2), true], [5, Math.round(base / 2), true]] as const) {
      const { result } = win(campaignWith(data, 'prologue_paktnacht', 'rout', { since }));
      expect(result.gold).toBe(gold);
      expect(result.haunt?.halved).toBe(halved);
    }
  });

  it('halves the bounty too (a lieutenant who flees)', () => {
    const run = (since: number) => {
      const c = campaignWith(data, 'prologue_paktnacht', 'rout', { since });
      const s = won(createHauntBattle(data, c, 'h1_0', ids(c)));
      s.units = s.units.map((u) => (u.lieutenant ? { ...u, gone: 'fled' as const, fledBy: s.units.find((x) => x.team === 'player')!.uid } : u));
      return finishBattle(data, c, s).result.bounty[0]!.gold;
    };
    expect(run(0)).toBe(data.balance.lieutenant.bounty.goldPerLevel);
    expect(run(3)).toBe(data.balance.lieutenant.bounty.goldPerLevel / 2);
  });

  it('pays haunt.expPct of the EP, and catchUpExpPct of that to a unit above the expected level', () => {
    const c = campaignWith(data, 'prologue_paktnacht', 'rout');
    const s = createHauntBattle(data, c, 'h1_0', ids(c));
    const u = s.units.find((x) => x.team === 'player')!;
    expect(s.hauntLevel).toBe(2);
    expect(expPercent(data, s, u)).toBe(60);
    u.level = 5;
    expect(expPercent(data, s, u)).toBe(30);
    // a level gained on the way does not cut the rest: the level the unit began with counts
    u.level = 1;
    const ev: never[] = [];
    grantExp(data, u, 10, seedRng(1), ev, expPercent(data, s, u));
    expect(u.battleExp).toBe(6);
    u.level = 5;
    expect(expPercent(data, { hauntId: undefined, hauntLevel: undefined }, u)).toBe(100);
    const story = createBattle(data, c, 'prologue', ids(c));
    expect(expPercent(data, story, story.units[0]!)).toBe(100);
  });

  it('reports the cap in the result', () => {
    const c = campaignWith(data, 'prologue_paktnacht', 'rout');
    const s = won(createHauntBattle(data, c, 'h1_0', ids(c)));
    const u = s.units.find((x) => x.team === 'player')!;
    u.level = 8;
    u.levelAtExpStart = 8;
    u.battleExp = 5;
    expect(finishBattle(data, c, s).result.haunt?.catchUp).toBe(true);
    u.levelAtExpStart = 1;
    u.level = 1;
    expect(finishBattle(data, c, s).result.haunt?.catchUp).toBe(false);
  });

  it('a won haunt goes, notes its variant, counts, and is no completed node', () => {
    const c = campaignWith(data, 'm1_1_steckbriefe', 'escort');
    const { campaign } = win(c);
    expect(campaign.haunts).toEqual([]);
    expect(campaign.hauntLast).toEqual({ m1_1_steckbriefe: 'escort' });
    expect(campaign.hauntsSinceStory).toBe(1);
    expect(campaign.completed).toEqual(c.completed);
  });

  it('a lost haunt leaves the campaign and the haunt as they were', () => {
    const c = campaignWith(data, 'prologue_paktnacht', 'rout');
    const s: BattleState = { ...createHauntBattle(data, c, 'h1_0', ids(c)), outcome: 'defeat' };
    const r = finishBattle(data, c, s);
    expect(r.campaign).toEqual(c);
    expect(r.result.outcome).toBe('defeat');
  });

  it('a won story mission starts the count again', () => {
    const c = { ...newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' } as never, { name: 'Rhen', portrait: 'avatar_a' } as never), hauntsSinceStory: 3 };
    const r = finishBattle(data, c, won(createBattle(data, c, 'prologue', ids(c))));
    expect(r.campaign.hauntsSinceStory).toBe(0);
    expect(r.campaign.completed).toContain('prologue');
  });

  it('runs through the campaign command finishMission, and a haunt that is gone cannot be finished', () => {
    const c = campaignWith(data, 'prologue_paktnacht', 'rout');
    const start = startBattle(data, createHauntBattle(data, c, 'h1_0', ids(c))).state;
    const done = autoplay(data, start);
    const cmd = { type: 'finishMission' as const, start, commands: done.log };
    expect(validateCampaign(data, c, cmd)).toBeNull();
    expect(validateCampaign(data, { ...c, haunts: [] }, cmd)).toBe('node_unavailable');
    if (done.state.outcome === 'victory') {
      const r = applyCampaign(data, c, cmd);
      expect(r.campaign.haunts).toEqual([]);
      expect(r.events.some((e) => e.t === 'missionFinished')).toBe(true);
    }
  });

  it('opening the card removes the NEU mark (seeHaunt), repeating changes nothing', () => {
    const c = campaignWith(data, 'prologue_paktnacht', 'rout');
    expect(c.haunts[0]!.new).toBe(true);
    const a = applyCampaign(data, c, { type: 'seeHaunt', id: 'h1_0' }).campaign;
    expect(a.haunts[0]!.new).toBe(false);
    expect(applyCampaign(data, a, { type: 'seeHaunt', id: 'h1_0' }).campaign.haunts).toEqual(a.haunts);
    expect(validateCampaign(data, c, { type: 'seeHaunt', id: 'nope' })).toBe('not_available');
  });

  it('restarting a haunt battle is allowed while it is open', () => {
    const c = campaignWith(data, 'prologue_paktnacht', 'rout');
    expect(validateCampaign(data, c, { type: 'restartMission', node: 'prologue', haunt: 'h1_0' })).toBeNull();
    expect(validateCampaign(data, c, { type: 'restartMission', node: 'prologue' })).toBe('node_unavailable');
  });
});

describe('haunt maps and content:check', () => {
  it('names the civilian in both languages (goal text of defend and escort)', () => {
    for (const lang of ['de', 'en']) expect(locales[lang]?.['unit.civilian.name']).toBeTruthy();
  });

  it('the maps of haunts do not disturb the content check', () => {
    const d = withTreasure();
    const c = campaignWith(d, 'm1_1_steckbriefe', 'treasure');
    createHauntBattle(d, c, 'h1_0', c.roster.map((u) => u.id));
    const issues = validateContent(data, locales).map((i) => i.message);
    expect(issues).toEqual([]);
  });
});

describe('goal text of haunts', () => {
  it('names the civilian in the goal of a defend and an escort haunt, in both languages', async () => {
    const { goalLine } = await import('../../src/ui/goalText');
    const { setLocales, lang } = await import('../../src/i18n');
    setLocales(locales);
    const d = withTreasure();
    for (const l of ['de', 'en'] as const) {
      lang.value = l;
      const civ = locales[l]!['unit.civilian.name']!;
      for (const [map, variant] of [['m1_1_steckbriefe', 'defend'], ['m1_1_steckbriefe', 'escort']] as const) {
        const v = d.maps[hauntMapIdFor(d, map, variant)]!.objectives.victory;
        const line = goalLine(v);
        expect(line).toContain(civ);
        expect(line).not.toMatch(/Liora/);
      }
    }
    lang.value = 'de';
  });
});

function hauntMapIdFor(d: GameData, map: string, variant: HauntVariant): string {
  const c = campaignWith(d, map, variant);
  return createHauntBattle(d, c, 'h1_0', c.roster.map((u) => u.id)).mapId;
}
