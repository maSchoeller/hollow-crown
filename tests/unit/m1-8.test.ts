/**
 * Story 9.9: node m1_8 (finale, act end, two ember sparks), the E4 line of the scene before, Grosk (joined or not), the steward,
 * Morra's retreat in round 10, the reward lines ("2 ×"), the reward moment of a scene line and the item `ember_spark`.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import {
  actFinished,
  addToRoster,
  applyCampaign,
  applyCommand,
  autoplay,
  availableNodes,
  beginBattle,
  conditionContext,
  consequenceLines,
  finishBattle,
  levelUp,
  newCampaign,
  normalizeCampaign,
  resolveScene,
  runReinforcements,
  runTriggers,
  type BattleState,
  type CampaignState,
  type GameData,
  type GameEvent,
} from '../../src/core';
import { hasPackForAct } from '../../src/packs/plan';
import { addTexts } from '../../src/i18n';
import { goalLine } from '../../src/ui/goalText';

let data: GameData;
let locales: ReturnType<typeof loadContentFromDisk>['locales'];
let base: CampaignState;

const STORY = ['prologue', 'm1_1', 'm1_2', 'm1_3', 'm1_4', 'm1_5', 'm1_6', 'm1_7'];
const NODE = 'm1_8';

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
  base = newCampaign(data, 7, { difficulty: 'easy', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  for (const id of ['kael', 'brenna', 'tobin', 'fenn', 'mira', 'liora', 'varek']) addToRoster(data, base, id);
  // an army as strong as one that played its way here (node expectedLevel), like `__hc.devNode`
  const level = data.campaign.nodes.find((n) => n.id === NODE)!.expectedLevel;
  for (const u of base.roster) while (u.level < level) levelUp(data, u, base.rng);
  base.completed = [...STORY];
});

const begin = (c: CampaignState): BattleState => beginBattle(data, c, NODE, c.roster.map((u) => u.id)).state;
const withFlags = (flags: Record<string, string | true>): CampaignState => ({ ...base, flags: { ...base.flags, ...flags } });
const lt = (s: BattleState, id: string) => s.units.find((u) => u.lieutenant === id);

/** The state after the wave of `turn` has come in (reinforcements run the way the turn change runs them). */
function wave(s: BattleState, turn: number): GameEvent[] {
  const events: GameEvent[] = [];
  s.turn = turn;
  s.phase = 'enemy';
  runReinforcements(data, s, events);
  return events;
}

describe('content', () => {
  it('passes the content check with the new node, scenes, item and keys', () => {
    expect(validateContent(data, locales)).toEqual([]);
  });

  it('knows the item ember_spark: a seal that stays in the convoy, no promote yet (story 10.2); promotion_seal is untouched', () => {
    const d = data.items.ember_spark!;
    expect(d.kind).toBe('seal');
    expect(d.slot).toBe('bag');
    expect(d.tags).toContain('convoyOnly');
    expect(d.price).toBe(3000);
    expect(d.use).toBeUndefined();
    expect(data.items.promotion_seal!.use).toEqual({ promote: true, minLevel: 10 });
  });
});

describe('node m1_8', () => {
  const node = () => data.campaign.nodes.find((n) => n.id === NODE)!;

  it('is the finale after m1_7 with the Pactwatch as home, two ember sparks and the world map place bound to it', () => {
    expect(node()).toMatchObject({ fixed: 'finale', place: 'paktwacht_heimat', merchantTier: 2, expectedLevel: 9, titleKey: 'node.m1_8.title', pre: 'scn.m1_8.intro', post: 'scn.m1_8.outro' });
    expect(node().requires).toEqual([{ completed: 'm1_7' }]);
    expect(node().effects).toEqual([{ item: { def: 'ember_spark' } }, { item: { def: 'ember_spark' } }]);
    expect(data.world.places.find((p) => p.id === NODE)!.node).toBe(NODE);
    expect(data.campaign.act).toBe(1);
  });

  it('opens only after every other story node and then is the only one open', () => {
    expect(availableNodes(data, base).filter((n) => n.kind !== 'side').map((n) => n.id)).toEqual([NODE]);
    expect(availableNodes(data, { ...base, completed: STORY.slice(0, -1) }).filter((n) => n.kind !== 'side').map((n) => n.id)).toEqual(['m1_7']);
    expect(availableNodes(data, { ...base, completed: [...STORY, NODE] }).filter((n) => n.kind !== 'side')).toEqual([]);
  });

  it('ends the act when won; without a pack for act 2 the world map says it is coming soon', () => {
    expect(actFinished(data, base)).toBe(false);
    expect(actFinished(data, { completed: [...STORY, NODE] })).toBe(true);
    // the build ships act 1 only (content/packs.yaml): nobody has act 2, so the hint shows
    expect(hasPackForAct([{ act: 1, load: 'precache' }, { act: 1, load: 'background' }], data.campaign.act + 1)).toBe(false);
  });
});

describe('scene before the map: one line per E4 outcome', () => {
  const lines = (c: CampaignState) => resolveScene(data, conditionContext(data, c), 'scn.m1_8.intro').filter((l) => l.kind === 'line');
  const e4 = (c: CampaignState) => lines(c).filter((l) => l.line === 'l05' || l.line === 'l06').map((l) => l.line);

  it('plays the rumour for shelter, the wolves for secret, and neither without a decision', () => {
    expect(e4(withFlags({ e04: 'shelter' }))).toEqual(['l05']);
    expect(e4(withFlags({ e04: 'secret' }))).toEqual(['l06']);
    expect(e4(base)).toEqual([]);
  });

  it('reads well without the E4 line (same lines around it) and every line fits a box', () => {
    expect(lines(base).map((l) => l.line)).toEqual(['l01', 'l02', 'l03', 'l04', 'l07', 'l07b', 'l08', 'l09']);
    for (const id of ['scn.m1_8.intro', 'scn.m1_8.outro', 'scn.m1_8.morra_retreat'])
      for (const l of data.scenes[id]!.lines) if ('text' in l) expect(l.text.length).toBeLessThanOrEqual(110);
  });
});

describe('map m1_8_paktwacht_halten', () => {
  it('has the steward, who heals and carries no weapon, defended for ten rounds; no haunt anchors', () => {
    const m = data.maps['m1_8_paktwacht_halten']!;
    expect(m.objectives.victory).toEqual({ type: 'defend', unit: 'steward', turns: 10 });
    expect(m.objectives.defeat).toContainEqual({ type: 'unit_dies', unit: 'steward' });
    const steward = m.units.find((u) => u.id === 'steward')!;
    expect(steward).toMatchObject({ team: 'other', class: 'healer', at: [8, 3], ai: { profile: 'hold' } });
    expect(steward.items.map((i) => i.def)).toEqual(['heal_staff']);
    expect(m.reinforcements.map((r) => r.turn)).toEqual([4, 8]);
    expect((m as { haunts?: unknown }).haunts).toBeUndefined();
  });

  it('counts 13 / 15 / 17 enemies with Grosk on the map, riders as wolf_rider, lieutenants with iron weapons and no class of their own', () => {
    const m = data.maps['m1_8_paktwacht_halten']!;
    const all = [...m.units, ...m.reinforcements.flatMap((r) => r.units)].filter((u) => u.team === 'enemy');
    const count = (d: 'easy' | 'normal' | 'hard') => all.filter((u) => !u.difficulty || u.difficulty.includes(d)).length;
    expect([count('easy'), count('normal'), count('hard')]).toEqual([13, 15, 17]);
    expect(all.filter((u) => u.lieutenant).map((u) => u.lieutenant).sort()).toEqual(['grosk', 'hask', 'morra', 'ulvric']);
    for (const u of all.filter((x) => x.lieutenant)) {
      // the loader takes the class of the lieutenant (the map names none)
      expect(u.class).toBe(data.lieutenants![u.lieutenant!]!.class);
      expect(u.items.some((i) => i.def.startsWith('steel_') || i.def === 'longbow')).toBe(false);
    }
    expect(all.filter((u) => u.nameKey === 'unit.wolf_rider.name').every((u) => u.class === 'wolf_rider')).toBe(true);
  });

  it('fields Hask in wave 1, Ulvric and Grosk in wave 2 and Morra in wave 3', () => {
    const s = begin(base);
    expect(lt(s, 'hask')).toBeDefined();
    expect(lt(s, 'ulvric')).toBeUndefined();
    wave(s, 4);
    expect(lt(s, 'ulvric')).toMatchObject({ classId: 'wolf_rider', team: 'enemy' });
    expect(lt(s, 'grosk')).toBeDefined();
    expect(lt(s, 'morra')).toBeUndefined();
    wave(s, 8);
    expect(lt(s, 'morra')?.pos).toBeTruthy();
  });

  it('leaves Grosk off the board when he has joined (E3), also as a reinforcement; the others come as before', () => {
    const s = begin(withFlags({ joined_grosk: true }));
    wave(s, 4);
    expect(lt(s, 'grosk')).toBeUndefined();
    expect(lt(s, 'ulvric')).toBeDefined();
    wave(s, 8);
    expect(s.units.filter((u) => u.team === 'enemy').length).toBe(12);
    const open = begin(base);
    wave(open, 4);
    wave(open, 8);
    expect(open.units.filter((u) => u.team === 'enemy').length).toBe(13);
  });
});

describe('the steward heals', () => {
  it('stays in the keep and heals a wounded ally next to him in his phase', () => {
    const s = begin(base);
    for (const u of s.units) if (u.team === 'enemy') Object.assign(u, { gone: 'dead', pos: null });
    const kael = s.units.find((u) => u.id === 'kael')!;
    kael.pos = [8, 4];
    kael.hp = 5;
    const r = applyCommand(data, s, { type: 'endPhase' });
    const steward = r.state.units.find((u) => u.id === 'steward')!;
    expect(steward.pos).toEqual([8, 3]);
    expect(r.state.units.find((u) => u.id === 'kael')!.hp).toBeGreaterThan(5);
    expect(r.events.some((e) => e.t === 'heal')).toBe(true);
  });
});

describe('Morra calls the retreat in round 10', () => {
  /** round 10 comes with Morra on the board at `at` and every other enemy gone */
  function round10(at: [number, number] = [8, 13]) {
    const s = begin(base);
    wave(s, 4);
    wave(s, 8);
    const morra = lt(s, 'morra')!;
    morra.pos = at;
    for (const u of s.units) if (u.team === 'enemy' && u.uid !== morra.uid) Object.assign(u, { gone: 'dead', pos: null });
    return { s, morra };
  }
  const startRound10 = (s: BattleState): GameEvent[] => {
    const events: GameEvent[] = [];
    s.turn = 10;
    s.phase = 'player';
    runTriggers(data, s, { kind: 'phase' }, events);
    return events;
  };

  it('speaks the call as a scene line of hers and switches her to flee', () => {
    const { s, morra } = round10();
    const events = startRound10(s);
    expect(events).toContainEqual({ t: 'dialogue', id: 'scn.m1_8.morra_retreat' });
    expect(morra.ai?.profile).toBe('flee');
    expect(data.scenes['scn.m1_8.morra_retreat']!.lines).toHaveLength(1);
    expect(s.firedTriggers).toContain('t_morra_retreat');
  });

  it('says nothing if she has left the map already (0 HP earlier: she fled like any lieutenant)', () => {
    const { s, morra } = round10();
    Object.assign(morra, { gone: 'fled', pos: null });
    expect(startRound10(s).some((e) => e.t === 'dialogue')).toBe(false);
  });

  it('withdraws in the enemy phase, is driven off like at 0 HP and the mission pays grudge and bounty', () => {
    const { s, morra } = round10([8, 18]);
    startRound10(s);
    const r = applyCommand(data, s, { type: 'endPhase' });
    const after = r.state.units.find((u) => u.uid === morra.uid)!;
    expect(after.gone).toBe('fled');
    expect(r.events).toContainEqual({ t: 'fled', unit: morra.uid });
    // she was the last foe and no wave is due: the steward has held, the mission ends at once, not at the start of round 11
    expect(r.state.turn).toBe(10);
    expect(r.state.outcome).toBe('victory');
    const done = finishBattle(data, base, r.state).campaign;
    expect(done.lieutenants?.morra).toMatchObject({ met: true, routs: 1, grudge: 1 });
    expect(done.gold).toBeGreaterThan(base.gold + data.maps['m1_8_paktwacht_halten']!.goldReward);
  });

  it('a Morra who is only seen on the field and does not flee counts as met, without rout and bounty', () => {
    const { s } = round10();
    s.outcome = 'victory';
    s.ltSeen = ['morra'];
    const done = finishBattle(data, base, s).campaign;
    expect(done.lieutenants?.morra).toMatchObject({ met: true, routs: 0, grudge: 0 });
  });
});

describe('the finale won and lost', () => {
  function playToVictory(c: CampaignState) {
    for (let seed = 1; seed < 40; seed++) {
      const start = begin({ ...c, seed });
      const played = autoplay(data, start);
      if (played.state.outcome === 'victory') return { start, played, seed };
    }
    throw new Error('no victory in 40 seeds');
  }

  it('gives two ember sparks in the convoy on a victory, saves and loads them, and the act is over', () => {
    const { start, played, seed } = playToVictory(base);
    const r = applyCampaign(data, { ...base, seed }, { type: 'finishMission', start, commands: played.log });
    const sparks = (cc: CampaignState) => cc.convoy.filter((i) => i.def === 'ember_spark').length;
    expect(sparks(base)).toBe(0);
    expect(sparks(r.campaign)).toBe(2);
    expect(r.events.filter((e) => e.t === 'itemGained' && e.def === 'ember_spark')).toHaveLength(2);
    expect(r.campaign.completed).toContain(NODE);
    expect(actFinished(data, r.campaign)).toBe(true);
    expect(availableNodes(data, r.campaign).filter((n) => n.kind !== 'side')).toEqual([]);
    expect(sparks(normalizeCampaign(data, JSON.parse(JSON.stringify(r.campaign))))).toBe(2);
    // two instances, not one counted twice
    expect(new Set(r.campaign.convoy.filter((i) => i.def === 'ember_spark').map((i) => i.uid)).size).toBe(2);
  });

  it('gives nothing after a defeat (the steward falls)', () => {
    const s = begin(base);
    const steward = s.units.find((u) => u.id === 'steward')!;
    steward.hp = 0;
    steward.gone = 'dead';
    s.outcome = 'defeat';
    s.defeatReason = 'steward';
    const r = finishBattle(data, base, s);
    expect(r.campaign.convoy.some((i) => i.def === 'ember_spark')).toBe(false);
    expect(r.campaign.completed).not.toContain(NODE);
  });

  it('loses when the steward dies', () => {
    const s = begin(base);
    s.units.find((u) => u.id === 'steward')!.gone = 'dead';
    const r = applyCommand(data, s, { type: 'endPhase' });
    expect(r.state.outcome).toBe('defeat');
  });
});

describe('reward card and scene moment', () => {
  it('sums repeated identical items into one line with an amount, single items and other lines unchanged', () => {
    const lines = consequenceLines(data.campaign.nodes.find((n) => n.id === NODE)!.effects ?? []);
    expect(lines).toEqual([{ kind: 'item', def: 'ember_spark', amount: 2 }, { kind: 'noted' }]);
    expect(consequenceLines([{ item: { def: 'vulnerary' } }])[0]).toEqual({ kind: 'item', def: 'vulnerary' });
    expect(consequenceLines([{ item: { def: 'vulnerary' } }, { gold: 5 }, { item: { def: 'vulnerary' } }]).filter((l) => l.kind === 'item')).toHaveLength(2);
  });

  it('names the card in both languages: "{n} × {name}"', () => {
    expect(locales.de?.['item.ember_spark.name']).toBe('Glutfunke');
    expect(locales.en?.['item.ember_spark.name']).toBe('Ember spark');
    expect(locales.de?.['ui.consequence.itemCount.title']).toBe('{n} × {name}');
    expect(locales.en?.['ui.consequence.itemCount.title']).toBe('{n} × {name}');
  });

  it('puts the panel and the reward moment into the outro: panel first, the moment on its second line, then back to the scene', () => {
    const lines = resolveScene(data, conditionContext(data, base), 'scn.m1_8.outro').filter((l) => l.kind === 'line');
    const panel = lines.findIndex((l) => l.panel === 'glutfunken');
    expect(panel).toBeGreaterThan(0);
    expect(lines.filter((l) => l.moment === 'reward').map((l) => l.line)).toEqual(['l08']);
    expect(lines.findIndex((l) => l.moment === 'reward')).toBeGreaterThan(panel);
    expect(lines.some((l) => l.panel === 'none')).toBe(true);
  });
});

describe('goal line of a defence', () => {
  it('names the unit to protect from the map, not a fixed one (the steward of 1-8, the elder of 1-2)', () => {
    addTexts('de', locales.de ?? {});
    const steward = data.maps['m1_8_paktwacht_halten']!;
    expect(goalLine(steward.objectives.victory, steward)).toBe('Verwalter schützen · 10 Runden');
    const elder = data.maps['m1_2_erlbach']!;
    expect(goalLine(elder.objectives.victory, elder)).not.toContain('Verwalter');
  });
});
