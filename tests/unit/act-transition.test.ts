/** The move from act 1 to act 2 (story 11.1, architecture §5.4): campaigns per act, `c.act`, `actReached`, values per act, saves. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { buildContent, contentPath, mergePackContent, type Locales } from '../../src/content/load';
import { contentFiles, loadContentFromDisk, readContentFiles } from '../../src/content/node';
import { checkPacks, parsePacks } from '../../src/content/packs';
import { validateContent } from '../../src/content/validate';
import {
  actCampaign,
  applyCampaign,
  autoplay,
  availableNodes,
  beginBattle,
  campaignOfAct,
  currentTier,
  enterNextAct,
  findNode,
  homeRooms,
  levelCap,
  lockedMechanics,
  merchantStock,
  newCampaign,
  nodeAct,
  normalizeCampaign,
  replayCampaign,
  storyCount,
  type BattleResult,
  type CampaignCommand,
  type CampaignState,
  type GameData,
} from '../../src/core';
import { metaFromCampaign, migrate, type SaveRecord } from '../../src/persistence/save';

let data: GameData;
let locales: Locales;
let open: GameData;

const avatar = { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as const;
const fresh = (seed = 5): CampaignState => newCampaign(data, seed, { difficulty: 'easy', deathMode: 'standard' }, avatar);
const actOneStory = () => data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
/** Act 1 done to its finale (a save after m1_8). */
const finaleDone = (): CampaignState => ({ ...fresh(), completed: actOneStory() });

/** Data whose act-1 finale is m1_1 (quick to win with autoplay); `released` = acts of the build. */
function withQuickFinale(released: number[]): GameData {
  const d = structuredClone(data);
  for (const n of d.acts[1]!.nodes) if (n.fixed === 'finale') delete n.fixed;
  d.acts[1]!.nodes.find((n) => n.id === 'm1_1')!.fixed = 'finale';
  d.releasedActs = released;
  return d;
}

/** Wins the (quick) finale m1_1 from a campaign that has every other story node of act 1 done. */
function winFinale(d: GameData): { campaign: CampaignState; events: ReturnType<typeof applyCampaign>['events']; cmd: CampaignCommand; before: CampaignState } {
  const before = { ...fresh(), completed: actOneStory().filter((id) => id !== 'm1_1') };
  for (let seed = 1; seed < 20; seed++) {
    const start = beginBattle(d, { ...before, seed }, 'm1_1', before.roster.map((u) => u.id)).state;
    const played = autoplay(d, start);
    if (played.state.outcome !== 'victory') continue;
    const cmd: CampaignCommand = { type: 'finishMission', start, commands: played.log };
    return { ...applyCampaign(d, before, cmd), cmd, before };
  }
  throw new Error('m1_1 not won by autoplay');
}

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
  open = { ...structuredClone(data), releasedActs: [1, 2] };
});

describe('content of the acts', () => {
  it('loads the campaign of every act folder; act 2 holds its head and its nodes, placeholders without maps except m2_1 and m2_2 (stories 11.3, 11.12, 11.13)', () => {
    expect(Object.keys(data.acts).map(Number)).toEqual([1, 2]);
    const a2 = data.acts[2]!;
    expect(a2).toMatchObject({ act: 2, levelCap: 20, mechanics: {}, home: 'castle', defaultPlace: 'grauwacht' });
    expect(a2.nodes.map((n) => n.id)).toEqual(['m2_1', 'm2_2', 'm2_3', 'm2_4', 'm2_5', 'm2_6', 'm2_7', 'm2_8', 'n4', 'n5', 'n6']);
    for (const n of a2.nodes) expect(!!data.maps[n.map], n.id).toBe(['m2_1', 'm2_2'].includes(n.id));
    expect(a2.scars).toEqual(data.acts[1]!.scars);
    expect(a2.merchant.map((m) => m.tier)).toEqual([0, 1, 2]);
  });

  it('loads the companions of act 2 with names in German and English', () => {
    const want = { jory: 'minstrel', ilka: 'marksman', odile: 'skirmisher', amos: 'healer', nell: 'scout', brann: 'elementalist', sable: 'duelist' };
    for (const [id, cls] of Object.entries(want)) {
      expect(data.chars[id], id).toMatchObject({ class: cls, act: 2 });
      expect(locales.de?.[`unit.${id}.name`], id).toBeTruthy();
      expect(locales.en?.[`unit.${id}.name`], id).toBeTruthy();
    }
    expect(data.chars.sable!.joins).toBe('lieutenant');
    expect(data.chars.brenna!.act).toBe(1);
  });

  it('only act 1 is released on disk (packs.yaml); the head files of act 2 are not in core', () => {
    expect(data.releasedActs).toEqual([1]);
    const packs = parsePacks(parseYaml(readFileSync(join(process.cwd(), 'content', 'packs.yaml'), 'utf8')));
    expect(checkPacks(packs, contentFiles(), data.acts[1]!)).toEqual([]);
    const intoCore = packs.map((p) => (p.id === 'core' ? { ...p, content: [...p.content, 'acts/act2/campaign.yaml'] } : p));
    expect(checkPacks(intoCore, contentFiles(), data.acts[1]!).map((i) => i.message)).toContain('acts/act2/campaign.yaml belongs to the pack of act 2, not to core');
  });

  it('finds nodes over the acts and stands in for an act whose pack is not loaded yet', () => {
    expect(findNode(data, 'm1_8')?.id).toBe('m1_8');
    expect(nodeAct(data, 'm1_8')).toBe(1);
    expect(findNode(data, 'nope')).toBeUndefined();
    const d = structuredClone(data);
    delete d.acts[2];
    const stand = campaignOfAct(d, 2);
    expect(stand).toMatchObject({ act: 2, nodes: [], levelCap: d.acts[1]!.levelCap });
    expect(actCampaign(d, { act: 2 }).act).toBe(2);
    expect(actCampaign(d, {}).act).toBe(1);
  });

  it('reports companion and flag ids twice across the acts, and node ids in content:check', () => {
    const files = readContentFiles();
    const key = (p: string) => Object.keys(files).find((k) => k.endsWith(p))!;
    const units = files[key('acts/act2/units.yaml')] as Array<{ id: string }>;
    files[key('acts/act2/units.yaml')] = [...units, { ...units[0]!, id: 'brenna' }];
    files[key('acts/act2/flags.yaml')] = [...(files[key('acts/act2/flags.yaml')] as unknown[]), { id: 'e02', kind: 'decision', season2: false }];
    const issues = buildContent(files).issues.map((i) => i.message);
    expect(issues).toContain('companion brenna is declared twice (acts/*/units.yaml)');
    expect(issues).toContain('flag e02 is declared twice (acts/*/flags.yaml)');
    const d = structuredClone(data);
    d.acts[2]!.nodes = [{ ...d.acts[1]!.nodes.find((n) => n.id === 'n1')! }];
    const msgs = validateContent(d, locales).map((i) => i.message);
    expect(msgs).toContain('node n1 is declared twice (act 1 and act 2)');
  });

  it('adds the head files of act 2 when its pack arrives in the browser (mergePackContent)', () => {
    const files = readContentFiles();
    const isAct2 = (k: string) => contentPath(k).startsWith('acts/act2/');
    const core = Object.fromEntries(Object.entries(files).filter(([k]) => !isAct2(k)));
    const pack = Object.fromEntries(Object.entries(files).filter(([k]) => isAct2(k)));
    const loaded = buildContent(core);
    expect(loaded.data.acts[2]).toBeUndefined();
    expect(loaded.data.chars.jory).toBeUndefined();
    expect(mergePackContent(loaded, pack)).toEqual([]);
    expect(loaded.data.acts[2]).toMatchObject({ act: 2, levelCap: 20 });
    expect(loaded.data.chars.jory).toMatchObject({ act: 2, class: 'minstrel' });
    expect(loaded.data.flags.e07).toBeDefined();
    expect(loaded.locales.de?.['unit.jory.name']).toBe('Jory');
    // a second pack naming known companions and flags again is refused, the first ones stay
    const again = mergePackContent(loaded, pack).map((i) => i.message);
    expect(again).toContain('companion jory is declared twice (acts/*/units.yaml)');
    expect(again).toContain('flag e07 is declared twice (acts/*/flags.yaml)');
  });

  it('allows a node of a later act whose map is not built yet, never in act 1', () => {
    const d = structuredClone(data);
    const placeholder = { ...d.acts[1]!.nodes.find((n) => n.id === 'm1_1')!, id: 'm2_x', map: 'm2_x_not_yet', fixed: 'first' as const, requires: undefined, effects: undefined, effectsIf: undefined, pre: undefined, post: undefined };
    d.acts[2]!.nodes = [placeholder];
    expect(validateContent(d, locales).map((i) => i.message).filter((m) => m.includes('m2_x_not_yet'))).toEqual([]);
    d.acts[1]!.nodes[1]!.map = 'nowhere';
    expect(validateContent(d, locales).map((i) => i.message)).toContain(`${d.acts[1]!.nodes[1]!.id}: unknown map nowhere`);
  });
});

describe('the move to act 2', () => {
  it('after the finale with act 2 released: c.act = 2 and actReached', () => {
    const r = winFinale(withQuickFinale([1, 2]));
    expect(r.campaign.act).toBe(2);
    expect(r.events).toContainEqual({ t: 'actReached', act: 2 });
    const done = r.events.find((e) => e.t === 'missionFinished') as { result: BattleResult };
    expect(done.result.outcome).toBe('victory');
    // the company, its gold and its convoy carry over
    expect(r.campaign.roster.length).toBeGreaterThan(0);
    expect(r.campaign.gold).toBeGreaterThan(0);
  });

  it('without act 2 in the build the act stays ("coming soon", story 7.3)', () => {
    const r = winFinale(withQuickFinale([1]));
    expect(r.campaign.act).toBe(1);
    expect(r.events.some((e) => e.t === 'actReached')).toBe(false);
  });

  it('replays to the same campaign from the journal', () => {
    const d = withQuickFinale([1, 2]);
    const r = winFinale(d);
    expect(replayCampaign(d, r.before, [r.cmd])).toEqual(r.campaign);
  });

  it('enterNextAct moves only once the finale is done, and only one act', () => {
    const c = fresh();
    expect(enterNextAct(open, c)).toBe(false);
    const done = finaleDone();
    const events: Parameters<typeof enterNextAct>[2] = [];
    expect(enterNextAct(open, done, events)).toBe(true);
    expect(done.act).toBe(2);
    expect(events).toEqual([{ t: 'actReached', act: 2 }]);
    // act 2 has no finale yet: no further move
    expect(enterNextAct({ ...open, releasedActs: [1, 2, 3] }, done)).toBe(false);
  });
});

describe('a save from the act-1 release', () => {
  it('without c.act is in act 1; with the finale done it moves on once act 2 is released', () => {
    const { act: _a, ...old } = finaleDone();
    const loadedNow = normalizeCampaign(data, structuredClone(old) as CampaignState);
    expect(loadedNow.act).toBe(1);
    const later = normalizeCampaign(open, structuredClone(old) as CampaignState);
    expect(later.act).toBe(2);
    for (const k of ['roster', 'gold', 'convoy', 'flags', 'fallen', 'lieutenants', 'completed'] as const) expect(later[k], k).toEqual(loadedNow[k]);
    const { act: _b, ...midway } = { ...fresh(), completed: ['prologue', 'm1_1'] };
    expect(normalizeCampaign(open, midway as CampaignState).act).toBe(1);
  });

  it('the fixture of a finished act 1 migrates, moves on to act 2 and the list shows "Akt 2"', () => {
    const rec = JSON.parse(readFileSync(join(process.cwd(), 'tests/fixtures/saves/format3-act1-finale-done.json'), 'utf8')) as SaveRecord;
    expect((rec.payload.campaign as Partial<CampaignState>).act).toBeUndefined();
    expect(rec.payload.campaign.completed).toContain('m1_8');
    const out = migrate(rec);
    const now = normalizeCampaign(data, out.payload.campaign);
    expect(metaFromCampaign(now).act).toBe(1);
    const moved = normalizeCampaign(open, migrate(rec).payload.campaign);
    expect(moved.act).toBe(2);
    expect(metaFromCampaign(moved).act).toBe(2);
    expect(moved.gold).toBe(rec.payload.campaign.gold);
    expect(moved.roster.map((u) => u.id)).toEqual(rec.payload.campaign.roster.map((u) => u.id));
  });
});

describe('in act 2', () => {
  const inAct2 = (): CampaignState => ({ ...finaleDone(), act: 2, home: { kind: 'castle', rooms: {} } });

  it('the values of act 2 hold: level cap 20, no staged mechanics, its own merchant, no story missions done', () => {
    const c = inAct2();
    expect(levelCap(open, 1)).toBe(10);
    expect(levelCap(open, 2)).toBe(20);
    expect(lockedMechanics(open, fresh())).not.toEqual([]);
    expect(lockedMechanics(open, c)).toEqual([]);
    expect(storyCount(open, c)).toBe(0);
    expect(currentTier(open, c)).toBe(0);
    expect(merchantStock(open, currentTier(open, c), 2)).toEqual(open.acts[2]!.merchant[0]!.items);
  });

  it('offers no story node of act 1, but the open side quests of act 1', () => {
    const c = { ...inAct2(), completed: actOneStory(), quests: ['n1'] };
    const nodes = availableNodes(open, c).map((n) => n.id);
    expect(nodes.filter((id) => open.acts[1]!.nodes.find((n) => n.id === id)?.kind === 'story')).toEqual([]);
    expect(nodes).toContain('n1');
  });

  it('no room closes at the move (rooms.yaml: act 2 or the story count of act 1)', () => {
    const before = finaleDone();
    before.home = { kind: 'castle', rooms: {} };
    const openRooms = (c: CampaignState) => homeRooms(open, c).filter((r) => r.open).map((r) => r.room.id);
    const after = { ...before, act: 2 };
    for (const id of openRooms(before)) expect(openRooms(after), id).toContain(id);
    expect(openRooms(after)).toEqual(expect.arrayContaining(['smith', 'healer', 'tavern', 'campfire']));
  });
});
