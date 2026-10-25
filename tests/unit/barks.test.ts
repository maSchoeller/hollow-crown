import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import { barkFor, barkScene, hasBark, BARK_LINES } from '../../src/app/battle/barks';
import { beginBattle, firstNode, getUnit, newCampaign, type BattleState, type GameData, type GameEvent } from '../../src/core';

let data: GameData;
let locales: Record<string, Record<string, string>>;
let s: BattleState;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

beforeAll(() => {
  const content = loadContentFromDisk();
  data = content.data;
  locales = content.locales;
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  s = beginBattle(data, c, firstNode(data).id, c.roster.map((r) => r.id)).state;
});

const speakers = () => s.units.filter((u) => u.team === 'player' && hasBark(data, u.charId ?? u.id, 'battle_start'));
const enemy = () => s.units.find((u) => u.team === 'enemy')!;

describe('combat barks (story 9.13)', () => {
  it('the content has a bark scene with all six lines for the deployed companions', () => {
    expect(speakers().length).toBeGreaterThan(0);
    for (const u of speakers()) for (const line of BARK_LINES) expect(hasBark(data, u.charId ?? u.id, line), `${u.id}.${line}`).toBe(true);
    expect(hasBark(data, 'avatar', 'crit')).toBe(false);
  });

  it('opens the first player phase with one deployed companion, chosen by the pick', () => {
    const e: GameEvent = { t: 'phase', phase: 'player', turn: 1 };
    const able = s.units.filter((u) => u.team === 'player' && u.pos && !u.gone && !u.downed && hasBark(data, u.charId ?? u.id, 'battle_start'));
    expect(able.length).toBeGreaterThan(0);
    const last = barkFor(data, s, e, (n) => n - 1)!;
    expect(last.unit).toBe(able[able.length - 1]!.uid);
    expect(last.line).toBe('battle_start');
    expect(last.scene).toBe(barkScene(able[able.length - 1]!.charId ?? able[able.length - 1]!.id));
    expect(barkFor(data, s, { t: 'phase', phase: 'player', turn: 2 })).toBeNull();
    expect(barkFor(data, s, { t: 'phase', phase: 'enemy', turn: 1 })).toBeNull();
    const down = clone(s);
    for (const u of down.units) if (u.team === 'player') u.downed = true;
    expect(barkFor(data, down, e)).toBeNull();
  });

  it('crit: only a hitting crit of a player unit speaks', () => {
    const u = speakers()[0]!;
    const strike = (attacker: string, hit: boolean, crit: boolean): GameEvent => ({ t: 'strike', attacker, defender: enemy().uid, hit, crit, dmg: 5, hpAfter: 1, ranged: false, magic: false });
    expect(barkFor(data, s, strike(u.uid, true, true))).toEqual({ unit: u.uid, anchor: u.uid, scene: barkScene(u.charId ?? u.id), line: 'crit' });
    expect(barkFor(data, s, strike(u.uid, true, false))).toBeNull();
    expect(barkFor(data, s, strike(u.uid, false, true))).toBeNull();
    expect(barkFor(data, s, strike(enemy().uid, true, true))).toBeNull();
  });

  it('downed and level_up: the unit itself speaks; enemies and units without a scene stay silent', () => {
    const u = speakers()[0]!;
    expect(barkFor(data, s, { t: 'downed', unit: u.uid })?.line).toBe('downed');
    expect(barkFor(data, s, { t: 'levelUp', unit: u.uid, level: 2, gains: {} })).toMatchObject({ unit: u.uid, line: 'level_up' });
    expect(barkFor(data, s, { t: 'downed', unit: enemy().uid })).toBeNull();
    const plain = clone(s);
    const p = getUnit(plain, u.uid);
    p.id = 'nobody';
    p.charId = undefined;
    expect(barkFor(data, plain, { t: 'downed', unit: u.uid })).toBeNull();
  });

  it('rescued: the rescued unit speaks, the bubble sits above the rescuer', () => {
    const [a, b] = speakers();
    const bark = barkFor(data, s, { t: 'rescued', unit: a!.uid, by: b!.uid })!;
    expect(bark).toMatchObject({ unit: a!.uid, anchor: b!.uid, line: 'rescued' });
    expect(barkFor(data, s, { t: 'moved', unit: a!.uid, path: [] })).toBeNull();
  });

  it('content:check: bark line ids and length per language', () => {
    const id = barkScene((speakers()[0]!.charId ?? speakers()[0]!.id));
    const problems = (d: GameData, l = locales) => validateContent(d, l).map((i) => i.message);
    const d = clone(data);
    const lines = d.scenes[id]!.lines;
    lines.push({ ...clone(lines[0]!), id: 'extra' } as never);
    expect(problems(d)).toContainEqual(expect.stringContaining('bark line id must be one of'));
    const long = clone(data);
    (long.scenes[id]!.lines[0] as { text: string }).text = 'x'.repeat(data.balance.scene.bubbleMaxChars + 1);
    expect(problems(long)).toContainEqual(expect.stringContaining('de bark longer than'));
    const key = `dlg.${id}.battle_start`;
    const en = { ...locales, en: { ...locales.en, [key]: 'y'.repeat(data.balance.scene.bubbleMaxChars + 1) } };
    expect(problems(data, en)).toContainEqual(expect.stringContaining('en bark longer than'));
  });

  it('content:check: bark speaker chain, known character, no answers', () => {
    const id = barkScene(speakers()[0]!.charId ?? speakers()[0]!.id);
    const who = id.slice('scn.bark.'.length);
    const problems = (d: GameData) => validateContent(d, locales).map((i) => i.message);
    const other = clone(data);
    (other.scenes[id]!.lines[0] as { speaker?: string[] }).speaker = ['avatar'];
    expect(problems(other)).toContainEqual(expect.stringContaining(`bark speaker chain must be exactly [${who}]`));
    const chain = clone(data);
    (chain.scenes[id]!.lines[0] as { speaker?: string[] }).speaker = [who, 'avatar'];
    expect(problems(chain)).toContainEqual(expect.stringContaining('bark speaker chain must be exactly'));
    const unknown = clone(data);
    unknown.scenes['scn.bark.nobody'] = { ...clone(unknown.scenes[id]!), id: 'scn.bark.nobody' };
    expect(problems(unknown)).toContainEqual(expect.stringContaining('bark scene for unknown character nobody'));
    const choice = clone(data);
    choice.scenes[id]!.lines.push({ id: 'level_up', choice: [{ id: 'a', text: 'A', effects: [] }] } as never);
    expect(problems(choice)).toContainEqual(expect.stringContaining('a bark scene has no answers'));
  });
});
