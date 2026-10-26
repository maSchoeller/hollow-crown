/** The chronicle (story 4.7): decisions per act with answer and consequences, pages found, content checks. */
import { beforeAll, describe, expect, it } from 'vitest';
import { buildContent } from '../../src/content/load';
import { loadContentFromDisk, readContentFiles } from '../../src/content/node';
import type { Locales } from '../../src/content/load';
import { validateContent } from '../../src/content/validate';
import { applyCampaign, chronicleTexts, chronicleView, newCampaign, type CampaignState, type GameData, type SceneDef } from '../../src/core';
import { clone } from '../../src/core/util';

let data: GameData;
let locales: Locales;

const scene: SceneDef = {
  id: 'scn.test.chronicle',
  lines: [
    {
      id: 'c01',
      title: 'Mira darf heimkehren',
      choice: [
        { id: 'home', stance: 'warm', text: 'Geh heim.', summary: 'Mira kehrt heim', effects: [{ leave: 'mira' }, { gold: 100 }, { chronicle: 'p_a1_1' }] },
        { id: 'stay', stance: 'sober', text: 'Bleib.', summary: 'Mira bleibt', effects: [] },
      ],
    },
  ],
};

const fresh = (): CampaignState => {
  const c = newCampaign(data, 9, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  return applyCampaign(data, c, { type: 'effects', effects: [{ recruit: 'mira' }] }).campaign;
};

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
  data.scenes[scene.id] = scene;
  data.chronicle.p_a1_1 = { id: 'p_a1_1', act: 1, title: 'Aldric III.', text: 'Er starb vor dem ersten Schnee.' };
  data.chronicle.p_a2_1 = { id: 'p_a2_1', act: 2, title: 'Die Gabe', text: 'Sie gaben etwas.' };
});

describe('chronicleView', () => {
  it('shows the current act even before anything happened', () => {
    const v = chronicleView(data, fresh());
    expect(v).toEqual({ acts: [{ act: 1, decisions: [], pages: [] }], found: 0, total: 12 });
    expect(v.total).toBe(data.balance.chronicle.seasonPages);
  });

  it('lists a decision with the answer given and its consequences, and the page it found', () => {
    const c = applyCampaign(data, fresh(), { type: 'choose', scene: scene.id, line: 'c01', option: 'home' }).campaign;
    const v = chronicleView(data, c);
    expect(v.found).toBe(1);
    expect(v.acts).toEqual([
      {
        act: 1,
        pages: ['p_a1_1'],
        decisions: [
          {
            scene: scene.id,
            line: 'c01',
            titleKey: 'dlg.scn.test.chronicle.c01.title',
            answerKey: 'dlg.scn.test.chronicle.c01.home',
            summaryKey: 'dlg.scn.test.chronicle.c01.home.summary',
            consequences: [
              { kind: 'leave', unit: 'mira' },
              { kind: 'gold', amount: 100 },
              { kind: 'chronicle', page: 'p_a1_1' },
            ],
          },
        ],
      },
    ]);
  });

  it('groups by act, oldest first, and leaves out what the content no longer knows', () => {
    const c = fresh();
    c.chronicle = ['p_a2_1', 'gone', 'p_a1_1'];
    c.decisions = [
      { act: 2, scene: scene.id, line: 'c01', option: 'stay' },
      { act: 1, scene: 'scn.removed', line: 'c01', option: 'x' },
    ];
    const v = chronicleView(data, c);
    expect(v.found).toBe(2);
    expect(v.acts.map((a) => [a.act, a.pages, a.decisions.map((d) => d.answerKey)])).toEqual([
      [1, ['p_a1_1'], []],
      [2, ['p_a2_1'], ['dlg.scn.test.chronicle.c01.stay']],
    ]);
  });
});

describe('chronicle pages as content', () => {
  it('chronicleTexts keys a page as chronicle.<id>.title|text', () => {
    expect(chronicleTexts(data.chronicle.p_a1_1!)).toEqual({ 'chronicle.p_a1_1.title': 'Aldric III.', 'chronicle.p_a1_1.text': 'Er starb vor dem ersten Schnee.' });
  });

  it('the loader takes pages from acts/actN/chronicle.yaml, with the act from the path and German texts', () => {
    expect(Object.keys(loadContentFromDisk().data.chronicle)).toEqual(['a1_watchtower']); // the pages of act 1 arrive with its missions (Epic 9); N2 brings the first
    const built = buildContent({ ...readContentFiles(), 'content/acts/act2/chronicle.yaml': [{ id: 'p_x', title: 'Titel', text: 'Text' }] });
    expect(built.data.chronicle.p_x).toEqual({ id: 'p_x', act: 2, title: 'Titel', text: 'Text' });
    expect(built.locales.de?.['chronicle.p_x.text']).toBe('Text');
  });

  it('content:check: unknown pages, missing English, more pages than the season', () => {
    const problems = (d: GameData, l: Locales = locales) => validateContent(d, l).map((i) => i.message);
    const d = clone(data);
    delete d.scenes[scene.id];
    d.chronicle = {};
    d.scenes['scn.prologue.intro']!.lines.push({ id: 'x1', mood: 'neutral', text: 'x', requires: [{ chronicle: ['nope'] }] } as never);
    expect(problems(d)).toContainEqual(expect.stringContaining('unknown chronicle page nope'));
    const withPage = clone(data);
    delete withPage.scenes[scene.id];
    withPage.chronicle = { p1: { id: 'p1', act: 1, title: 'T', text: 'X' } };
    expect(problems(withPage, { de: { ...locales.de, ...chronicleTexts(withPage.chronicle.p1!) }, en: locales.en! })).toContainEqual('missing key chronicle.p1.title');
    const many = clone(withPage);
    for (let i = 0; i < 13; i++) many.chronicle[`q${i}`] = { id: `q${i}`, act: 1, title: 'T', text: 'X' };
    expect(problems(many)).toContainEqual(expect.stringContaining('chronicle pages, the season has 12'));
  });
});
