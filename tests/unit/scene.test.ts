/** Scene schema, speaker chains, memorial lines and their content checks (story 4.4; architecture §5.8). */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import type { Locales } from '../../src/content/load';
import { sceneSchema } from '../../src/content/schemas';
import { validateContent } from '../../src/content/validate';
import { clone, conditionContext, lineKey, memorialKey, optionKey, resolveScene, sceneTexts, speakerTeam, type ConditionContext, type GameData, type SceneDef } from '../../src/core';

let data: GameData;
let locales: Locales;

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});

const ctx = (over: Partial<ConditionContext> = {}): ConditionContext => ({ ...conditionContext(data, null), ...over });

const scene: SceneDef = sceneSchema.parse({
  id: 'scn.test.one',
  lines: [
    {
      id: 'l01',
      speaker: ['liora', 'ysolde', 'kael'],
      mood: 'sad',
      text: 'Diese Zeichen.',
      memorial: { speaker: ['avatar'], text: 'Liora hätte das lesen können.' },
    },
    { id: 'l02', speaker: ['brenna'], fallback: 'skip', text: 'Ich nicht.' },
    { id: 'l03', text: 'Erzähler.', requires: [{ flag: 'avatar_honest' }] },
    {
      id: 'c01',
      choice: [
        { id: 'a', stance: 'warm', text: 'Ja.', effects: [{ setFlag: 'avatar_honest' }] },
        { id: 'b', stance: 'defiant', text: 'Nein.' },
      ],
    },
  ],
}) as SceneDef;

const withScene = (): GameData => {
  const d = clone(data);
  d.scenes[scene.id] = clone(scene);
  return d;
};

describe('speakerTeam', () => {
  it('reads the side of a speaker from the map units', () => {
    expect(speakerTeam(data, 'bh_leader')).toBe('enemy');
    expect(speakerTeam(data, 'tg1')).toBe('enemy');
    expect(speakerTeam(data, 'hask')).toBe('enemy');
    expect(speakerTeam(data, 'morra')).toBe('enemy');
    expect(speakerTeam(data, 'liora')).toBe('other');
  });
  it('puts everyone else on the player side', () => {
    for (const id of ['avatar', 'kael', 'brenna', 'nobody']) expect(speakerTeam(data, id)).toBe('player');
  });
});

describe('resolveScene', () => {
  it('the first living speaker of the chain speaks', () => {
    const d = withScene();
    const first = (c: ConditionContext) => resolveScene(d, c, scene.id).find((l) => l.kind === 'line' && l.line === 'l01' && !l.memorial) as { speaker: string };
    expect(first(ctx()).speaker).toBe('liora');
    expect(first(ctx({ fallen: ['liora'] })).speaker).toBe('ysolde');
    expect(first(ctx({ fallen: ['liora'], left: ['ysolde'] })).speaker).toBe('kael');
    expect(first(ctx({ fallen: ['liora', 'ysolde', 'kael'] })).speaker).toBe('kael'); // kael and the avatar never go
  });

  it('a line with fallback skip vanishes when its chain is gone', () => {
    const d = withScene();
    const ids = (c: ConditionContext) => resolveScene(d, c, scene.id).map((l) => l.uid);
    expect(ids(ctx())).toContain('l02');
    expect(ids(ctx({ fallen: ['brenna'] }))).not.toContain('l02');
    expect(ids(ctx({ left: ['brenna'] }))).not.toContain('l02');
  });

  it('a memorial line follows when the first figure has fallen, not when she merely left', () => {
    const d = withScene();
    const alive = resolveScene(d, ctx(), scene.id).map((l) => l.uid);
    expect(alive).not.toContain('l01.memorial');
    const left = resolveScene(d, ctx({ left: ['liora'] }), scene.id).map((l) => l.uid);
    expect(left).not.toContain('l01.memorial');
    const dead = resolveScene(d, ctx({ fallen: ['liora'] }), scene.id);
    const i = dead.findIndex((l) => l.uid === 'l01');
    expect(dead[i + 1]).toMatchObject({ kind: 'line', uid: 'l01.memorial', speaker: 'avatar', memorial: true, key: 'dlg.scn.test.one.l01.memorial', mood: 'sad' });
    // a dead second figure gives no memorial line
    expect(resolveScene(d, ctx({ fallen: ['ysolde'] }), scene.id).map((l) => l.uid)).not.toContain('l01.memorial');
  });

  it('lines with unmet requires drop out, answers carry their effects and stance', () => {
    const d = withScene();
    expect(resolveScene(d, ctx(), scene.id).map((l) => l.uid)).not.toContain('l03');
    const set = resolveScene(d, ctx({ flags: { avatar_honest: true } }), scene.id);
    expect(set.map((l) => l.uid)).toContain('l03');
    const choice = set.find((l) => l.kind === 'choice');
    expect(choice).toMatchObject({
      options: [
        { id: 'a', key: 'dlg.scn.test.one.c01.a', stance: 'warm', effects: [{ setFlag: 'avatar_honest' }] },
        { id: 'b', key: 'dlg.scn.test.one.c01.b', stance: 'defiant', effects: [] },
      ],
    });
  });

  it('narration has no speaker; an unknown scene throws', () => {
    const d = withScene();
    const n = resolveScene(d, ctx({ flags: { avatar_honest: true } }), scene.id).find((l) => l.uid === 'l03');
    expect(n).toMatchObject({ kind: 'line' });
    expect(n).not.toHaveProperty('speaker');
    expect(() => resolveScene(d, ctx(), 'nope')).toThrow();
  });

  it('keys are generated from scene, line and answer', () => {
    expect(lineKey('s', 'l01')).toBe('dlg.s.l01');
    expect(memorialKey('s', 'l01')).toBe('dlg.s.l01.memorial');
    expect(optionKey('s', 'c01', 'a')).toBe('dlg.s.c01.a');
    expect(Object.keys(sceneTexts(scene)).sort()).toEqual(['dlg.scn.test.one.c01.a', 'dlg.scn.test.one.c01.b', 'dlg.scn.test.one.l01', 'dlg.scn.test.one.l01.memorial', 'dlg.scn.test.one.l02', 'dlg.scn.test.one.l03']);
  });

  it('the shipped scenes resolve for a fresh company and for one whose companions are all gone', () => {
    for (const id of Object.keys(data.scenes)) {
      const full = resolveScene(data, ctx(), id);
      expect(full.length).toBeGreaterThan(0);
      resolveScene(data, ctx({ fallen: ['tobin', 'brenna', 'mira', 'liora', 'varek'] }), id);
    }
  });
});

describe('scene schema', () => {
  const parse = (over: Record<string, unknown>) => sceneSchema.safeParse({ id: 's', lines: [{ id: 'l01', text: 'x', ...over }] }).success;

  it('knows four moods and defaults to neutral', () => {
    for (const mood of ['neutral', 'happy', 'angry', 'sad']) expect(parse({ mood })).toBe(true);
    expect(parse({ mood: 'surprised' })).toBe(false);
    expect(parse({})).toBe(true);
  });
  it('rejects empty chains, repeated speakers, stray keys and answers without stance', () => {
    expect(parse({ speaker: [] })).toBe(false);
    expect(parse({ speaker: ['kael', 'kael'] })).toBe(false);
    expect(parse({ side: 'left' })).toBe(false);
    const choice = (o: Record<string, unknown>) => sceneSchema.safeParse({ id: 's', lines: [{ id: 'c01', choice: [{ id: 'a', text: 'x', ...o }, { id: 'b', text: 'y', stance: 'warm' }] }] }).success;
    expect(choice({ stance: 'warm' })).toBe(true);
    expect(choice({})).toBe(false);
    expect(choice({ stance: 'angry' })).toBe(false);
  });
});

describe('content:check for scenes', () => {
  const run = (mutate: (d: GameData, l: Locales) => void): string[] => {
    const d = withScene();
    const l: Locales = { de: { ...locales.de }, en: { ...locales.en } };
    // the test scene is complete unless a case breaks it
    for (const [k, v] of Object.entries(sceneTexts(scene))) {
      l.de![k] = v;
      l.en![k] = v;
    }
    mutate(d, l);
    return validateContent(d, l).map((i) => `${i.file}: ${i.message}`);
  };

  it('the shipped content and a well-formed scene are clean', () => {
    expect(run(() => undefined)).toEqual([]);
  });
  it('a box over 110 characters fails in German and in English', () => {
    const long = 'x'.repeat(111);
    expect(run((d) => ((d.scenes[scene.id]!.lines[1] as { text: string }).text = long))).toContainEqual(expect.stringContaining('l02: de text longer than 110'));
    expect(run((_d, l) => (l.en![lineKey(scene.id, 'l02')] = long))).toContainEqual(expect.stringContaining('l02: en text longer than 110'));
    expect(run((_d, l) => (l.en![lineKey(scene.id, 'l02')] = 'x'.repeat(110)))).toEqual([]);
  });
  it('a chain must end with avatar or kael unless the line is skippable', () => {
    expect(run((d) => ((d.scenes[scene.id]!.lines[0] as { speaker: string[] }).speaker = ['liora', 'ysolde']))).toContainEqual(expect.stringContaining('must end with avatar or kael'));
    expect(run((d) => ((d.scenes[scene.id]!.lines[1] as { speaker: string[] }).speaker = ['brenna', 'tobin']))).toEqual([]); // fallback: skip
    expect(run((d) => ((d.scenes[scene.id]!.lines[0] as { memorial: { speaker: string[] } }).memorial.speaker = ['tobin']))).toContainEqual(expect.stringContaining('l01.memorial: speaker chain must end'));
  });
  it('enemy and lieutenant chains need no fallback, mixed chains still do', () => {
    const lineAt = (d: GameData) => d.scenes[scene.id]!.lines[0] as { speaker: string[]; memorial?: unknown };
    expect(run((d) => ((lineAt(d).speaker = ['hask']), delete lineAt(d).memorial))).toEqual([]);
    expect(run((d) => ((lineAt(d).speaker = ['hask', 'morra']), delete lineAt(d).memorial))).toEqual([]);
    expect(run((d) => ((lineAt(d).speaker = ['hask', 'brenna']), delete lineAt(d).memorial))).toContainEqual(expect.stringContaining('must end with avatar or kael'));
    expect(run((d) => ((lineAt(d).speaker = ['brenna']), delete lineAt(d).memorial))).toContainEqual(expect.stringContaining('must end with avatar or kael'));
  });
  it('a missing English text fails', () => {
    expect(run((_d, l) => delete l.en![optionKey(scene.id, 'c01', 'b')])).toContainEqual(expect.stringContaining('missing en text dlg.scn.test.one.c01.b'));
    expect(run((_d, l) => delete l.en![memorialKey(scene.id, 'l01')])).toContainEqual(expect.stringContaining('missing en text'));
  });
  it('unknown speakers, bad references and duplicate ids fail', () => {
    expect(run((d) => ((d.scenes[scene.id]!.lines[0] as { speaker: string[] }).speaker = ['ghost', 'kael']))).toContainEqual(expect.stringContaining('unknown speaker ghost'));
    expect(run((d) => ((d.scenes[scene.id]!.lines[2] as { requires: unknown[] }).requires = [{ flag: 'ghost' }]))).toContainEqual(expect.stringContaining('undeclared flag ghost'));
    expect(run((d) => ((d.scenes[scene.id]!.lines[1] as { id: string }).id = 'l01'))).toContainEqual(expect.stringContaining('duplicate line id'));
  });
  it('answers are not allowed in scenes that play during a battle', () => {
    const msgs = run((d) => d.maps.prologue_paktnacht!.triggers[0]!.then.push({ action: 'dialogue', id: scene.id }));
    expect(msgs).toContainEqual(expect.stringContaining('scenes shown in a battle cannot have answers'));
    expect(run((d) => (d.campaign.nodes[0]!.pre = scene.id))).toEqual([]); // before a mission is fine
  });
});
