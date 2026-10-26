/** Decisions and the consequence card (story 4.6): command `choose`, stance, chronicle record, content rules. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import type { Locales } from '../../src/content/load';
import { validateContent } from '../../src/content/validate';
import {
  applyCampaign,
  choiceKey,
  consequenceLines,
  conditionContext,
  newCampaign,
  normalizeCampaign,
  replayCampaign,
  resolveScene,
  sceneTexts,
  validateCampaign,
  type CampaignState,
  type GameData,
  type SceneDef,
} from '../../src/core';
import { clone } from '../../src/core/util';

let data: GameData;
let locales: Locales;

/** E1-like test decision: Mira goes home (leave + gold + chronicle page) or stays. */
const decisionScene = (): SceneDef => ({
  id: 'scn.test.decision',
  lines: [
    { id: 'l01', speaker: ['mira', 'avatar'], mood: 'neutral', text: 'Bleibe ich?' },
    {
      id: 'c01',
      title: 'Mira darf heimkehren',
      choice: [
        { id: 'home', stance: 'warm', text: 'Geh heim.', summary: 'Mira kehrt heim', effects: [{ setFlag: { e01: 'home' } }, { leave: 'mira' }, { gold: 100 }, { chronicle: 'page_a1_1' }] },
        { id: 'stay', stance: 'defiant', text: 'Bleib.', summary: 'Mira bleibt', effects: [{ setFlag: { e01: 'stay' } }] },
      ],
    },
    { id: 'l02', speaker: ['mira', 'avatar'], mood: 'happy', text: 'Danke.', requires: [{ flag: { e01: 'stay' } }] },
  ],
});

const fresh = (): CampaignState => {
  const c = newCampaign(data, 5, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  return applyCampaign(data, c, { type: 'effects', effects: [{ recruit: 'mira' }] }).campaign;
};

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
  data.flags.e01 = { id: 'e01', kind: 'decision', values: ['home', 'stay', ...(data.flags.e01?.values ?? [])], season2: true };
  data.scenes['scn.test.decision'] = decisionScene();
  data.chronicle.page_a1_1 = { id: 'page_a1_1', act: 1, title: 'Die erste Seite', text: 'Ein König starb jung.' };
  locales.en = { ...locales.en, 'chronicle.page_a1_1.title': 'The first page', 'chronicle.page_a1_1.text': 'A king died young.' };
  locales.de = { ...locales.de, 'chronicle.page_a1_1.title': 'Die erste Seite', 'chronicle.page_a1_1.text': 'Ein König starb jung.' };
});

describe('resolveScene marks decisions', () => {
  it('a choice with a title is a decision, with title and summary keys', () => {
    const lines = resolveScene(data, conditionContext(data, fresh()), 'scn.test.decision');
    const c = lines.find((l) => l.kind === 'choice')!;
    expect(c).toMatchObject({ kind: 'choice', decision: true, titleKey: 'dlg.scn.test.decision.c01.title' });
    expect(c.kind === 'choice' && c.options.map((o) => o.summaryKey)).toEqual(['dlg.scn.test.decision.c01.home.summary', 'dlg.scn.test.decision.c01.stay.summary']);
    const chat = resolveScene(data, conditionContext(data, fresh()), 'scn.prologue.intro').find((l) => l.kind === 'choice')!;
    expect(chat).toMatchObject({ decision: false, titleKey: undefined });
  });

  it('sceneTexts carries title and summaries', () => {
    expect(sceneTexts(decisionScene())).toMatchObject({ 'dlg.scn.test.decision.c01.title': 'Mira darf heimkehren', 'dlg.scn.test.decision.c01.home.summary': 'Mira kehrt heim' });
  });
});

describe('command choose', () => {
  const cmd = (option: string) => ({ type: 'choose' as const, scene: 'scn.test.decision', line: 'c01', option });

  it('runs the effects, counts the stance and writes the decision into the chronicle', () => {
    const c = fresh();
    expect(validateCampaign(data, c, cmd('home'))).toBeNull();
    const r = applyCampaign(data, c, cmd('home'));
    expect(r.campaign.flags.e01).toBe('home');
    expect(r.campaign.roster.some((u) => u.id === 'mira')).toBe(false);
    expect(r.campaign.left).toContain('mira');
    expect(r.campaign.gold).toBe(c.gold + 100);
    expect(r.campaign.chronicle).toEqual(['page_a1_1']);
    expect(r.campaign.stance).toEqual({ warm: 1, sober: 0, defiant: 0 });
    expect(r.campaign.choices).toEqual({ [choiceKey('scn.test.decision', 'c01')]: 'home' });
    expect(r.campaign.decisions).toEqual([{ act: 1, scene: 'scn.test.decision', line: 'c01', option: 'home' }]);
    expect(r.events.map((e) => e.t)).toEqual(['goldChanged', 'choiceMade', 'stanceGained', 'flagSet', 'unitLeft', 'chronicleAdded']);
    expect(r.events).toContainEqual({ t: 'choiceMade', scene: 'scn.test.decision', line: 'c01', option: 'home', decision: true });
    // the input stays untouched
    expect(c.choices).toEqual({});
  });

  it('a chat answer counts the stance but is no decision', () => {
    const c = fresh();
    const r = applyCampaign(data, c, { type: 'choose', scene: 'scn.prologue.intro', line: 'c01', option: 'proud' });
    expect(r.campaign.stance.defiant).toBe(1);
    expect(r.campaign.flags.avatar_proud).toBe(true);
    expect(r.campaign.decisions).toEqual([]);
    expect(r.events).toContainEqual({ t: 'choiceMade', scene: 'scn.prologue.intro', line: 'c01', option: 'proud', decision: false });
  });

  it('answers are never taken back: the same choice twice is refused', () => {
    const c = applyCampaign(data, fresh(), cmd('stay')).campaign;
    expect(validateCampaign(data, c, cmd('home'))).toBe('already_chosen');
    expect(validateCampaign(data, c, cmd('stay'))).toBe('already_chosen');
    expect(() => applyCampaign(data, c, cmd('home'))).toThrow();
  });

  it('refuses unknown scenes, lines that are no choice and unknown answers', () => {
    const c = fresh();
    expect(validateCampaign(data, c, { type: 'choose', scene: 'nope', line: 'c01', option: 'home' })).toBe('unknown_choice');
    expect(validateCampaign(data, c, { type: 'choose', scene: 'scn.test.decision', line: 'l01', option: 'home' })).toBe('unknown_choice');
    expect(validateCampaign(data, c, cmd('maybe'))).toBe('unknown_choice');
  });

  it('refuses an answer whose effects cannot run (Mira has fallen)', () => {
    const c = fresh();
    c.roster = c.roster.filter((u) => u.id !== 'mira');
    c.fallen.push({ id: 'mira', nameKey: 'unit.mira.name', node: 'm1_2' });
    expect(validateCampaign(data, c, cmd('home'))).toBe('unknown_unit');
  });

  it('replays to the same campaign (journal)', () => {
    const c = fresh();
    const a = replayCampaign(data, c, [cmd('home')]);
    const b = replayCampaign(data, c, [cmd('home')]);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('older saves get empty choices and decisions', () => {
    const old = clone(fresh()) as unknown as Record<string, unknown>;
    delete old.choices;
    delete old.decisions;
    const n = normalizeCampaign(data, old as unknown as CampaignState);
    expect(n.choices).toEqual({});
    expect(n.decisions).toEqual([]);
  });
});

describe('consequenceLines', () => {
  it('one line per visible effect, flags and stance left out, the chronicle note last', () => {
    expect(
      consequenceLines([
        { setFlag: { e01: 'home' } },
        { stance: 'warm' },
        { leave: 'mira' },
        { recruit: 'grosk' },
        { gold: 600 },
        { material: { iron_ore: 2, moonsteel: 1 } },
        { item: { def: 'vulnerary' } },
        { chronicle: 'p1' },
        { openQuest: 'n1' },
        { grudge: { lt: 'hask', delta: -1 } },
        { priceMod: { pct: -10, act: 2 } },
        { villageAid: { act: 1 } },
        { setHome: 'castle' },
        { recruit: { lt: 'grosk' } },
      ]),
    ).toEqual([
      { kind: 'leave', unit: 'mira' },
      { kind: 'recruit', unit: 'grosk' },
      { kind: 'gold', amount: 600 },
      { kind: 'material', id: 'iron_ore', amount: 2 },
      { kind: 'material', id: 'moonsteel', amount: 1 },
      { kind: 'item', def: 'vulnerary' },
      { kind: 'chronicle', page: 'p1' },
      { kind: 'quest', node: 'n1' },
      { kind: 'grudge', lt: 'hask', delta: -1 },
      { kind: 'priceMod', pct: -10, act: 2 },
      { kind: 'villageAid', act: 1 },
      { kind: 'home', home: 'castle' },
      { kind: 'recruit', unit: 'grosk' },
      { kind: 'noted' },
    ]);
    expect(consequenceLines([])).toEqual([{ kind: 'noted' }]);
  });
});

describe('content:check of decisions', () => {
  const problems = (scene: SceneDef, en: Record<string, string> = {}) => {
    const d = clone(data);
    d.scenes = { [scene.id]: scene, ...Object.fromEntries(Object.entries(data.scenes).filter(([k]) => k !== 'scn.test.decision')) };
    const l = { de: { ...locales.de, ...sceneTexts(scene) }, en: { ...locales.en, ...en } };
    return validateContent(d, l).map((i) => i.message);
  };
  const enOf = (scene: SceneDef) => Object.fromEntries(Object.keys(sceneTexts(scene)).map((k) => [k, 'x']));

  it('a complete decision passes', () => {
    const s = decisionScene();
    expect(problems(s, enOf(s)).filter((m) => m.includes('scn.test') || m.includes('c01'))).toEqual([]);
  });

  it('an answer with consequences needs a title; a decision needs summaries; title is no answer id', () => {
    const noTitle = decisionScene();
    delete (noTitle.lines[1] as { title?: string }).title;
    expect(problems(noTitle, enOf(noTitle))).toEqual(expect.arrayContaining([expect.stringContaining('c01.home: an answer with consequences belongs to a decision'), expect.stringContaining('summary belongs to a decision')]));
    const noSummary = decisionScene();
    delete (noSummary.lines[1] as { choice: Array<{ summary?: string }> }).choice[1]!.summary;
    expect(problems(noSummary, enOf(noSummary))).toContainEqual(expect.stringContaining('c01.stay: a decision answer needs a summary'));
    const reserved = decisionScene();
    (reserved.lines[1] as { choice: Array<{ id: string }> }).choice[1]!.id = 'title';
    expect(problems(reserved, enOf(reserved))).toContainEqual(expect.stringContaining('answer id title is reserved'));
  });

  it('title and summaries need English texts', () => {
    const s = decisionScene();
    const en = enOf(s);
    delete en['dlg.scn.test.decision.c01.title'];
    delete en['dlg.scn.test.decision.c01.home.summary'];
    expect(problems(s, en)).toEqual(
      expect.arrayContaining([expect.stringContaining('missing en text dlg.scn.test.decision.c01.title'), expect.stringContaining('missing en text dlg.scn.test.decision.c01.home.summary')]),
    );
  });

  it('chat answers with story flags and stance stay plain answers', () => {
    expect(validateContent(data, locales).filter((i) => !i.file.includes('scn.test')).map((i) => i.message)).toEqual([]);
  });
});
