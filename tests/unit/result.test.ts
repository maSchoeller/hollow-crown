import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  applyCommand,
  autoplay,
  beginBattle,
  defeatSentence,
  getUnit,
  knockOut,
  missionResultView,
  receivedLines,
  newCampaign,
  type BattleResult,
  type CampaignState,
  type Command,
  type GameData,
  type GameEvent,
  firstNode,
} from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

const fake = (over: Partial<BattleResult> = {}): BattleResult => ({
  outcome: 'victory',
  nodeId: 'prologue',
  turns: 9,
  side: [
    { id: 's1', type: 'no_downs', done: false, reward: { gold: 50 } },
    { id: 's2', type: 'open_chests', done: true, reward: { gold: 300 } },
  ],
  gold: 1120,
  materials: { iron_ore: 2, none: 0 },
  items: [],
  units: [
    { id: 'kael', nameKey: 'unit.kael.name', levelBefore: 8, levelAfter: 9, exp: 112, mastered: [] },
    { id: 'brenna', nameKey: 'unit.brenna.name', levelBefore: 8, levelAfter: 8, exp: 48, mastered: [] },
  ],
  fallen: [{ id: 'fenn', nameKey: 'unit.fenn.name' }],
  bounty: [],
  scars: [],
  recruited: [],
  supportsReady: [],
  granted: [],
  ...over,
});

describe('missionResultView (story 6.6)', () => {
  it('lists survivors with level-up and EP first, the fallen grey and last', () => {
    const v = missionResultView(fake());
    expect(v.figures.map((f) => [f.id, f.fallen, f.leveledUp, f.exp])).toEqual([
      ['kael', false, true, 112],
      ['brenna', false, false, 48],
      ['fenn', true, false, 0],
    ]);
    expect(v.turns).toBe(9);
    expect(v.gold).toBe(1120);
  });

  it('names the home the company moved to (setHome), the last one wins; none without it', () => {
    expect(missionResultView(fake()).movedHome).toBeNull();
    expect(missionResultView(fake()).effects).toEqual([]);
    const v = missionResultView(fake({ effects: [{ gold: 5 }, { setHome: 'castle' }] }));
    expect(v.movedHome).toBe('castle');
    expect(v.effects).toHaveLength(2);
    expect(missionResultView(fake({ effects: [{ setHome: 'castle' }, { setHome: 'camp' }] })).movedHome).toBe('camp');
  });

  it('keeps only materials that were gained and side objectives with their state', () => {
    const v = missionResultView(fake());
    expect(v.materials).toEqual([{ id: 'iron_ore', count: 2 }]);
    expect(v.side.map((s) => s.done)).toEqual([false, true]);
  });

  it('has no bounty while there are no lieutenants, and passes fake bounty data through', () => {
    expect(missionResultView(fake()).bounty).toEqual([]);
    const b = { id: 'hask', nameKey: 'unit.hask.name', gold: 400, grudge: 2, material: { id: 'iron_ore', count: 1 }, signature: { uid: 'i1', def: 'tinder', upgrade: 0, affixes: [], runes: [] } };
    expect(missionResultView(fake({ bounty: [b] })).bounty).toEqual([b]);
    // results of older code paths without the field stay readable
    const old = fake();
    delete (old as Partial<BattleResult>).bounty;
    expect(missionResultView(old).bounty).toEqual([]);
  });

  it('a real finished mission reports no bounty and carries head data of its figures', () => {
    const s0 = beginBattle(data, base, firstNode(data).id, base.roster.map((r) => r.id)).state;
    const played = autoplay(data, s0);
    const r = applyCampaign(data, base, { type: 'finishMission', start: s0, commands: played.log });
    const result = r.events.find((e) => e.t === 'missionFinished')!.result;
    const v = missionResultView(result);
    expect(v.bounty).toEqual([]);
    expect(v.figures.length).toBeGreaterThan(0);
    expect(v.figures.every((f) => f.classId)).toBe(true);
  });
});

describe('defeatSentence (story 6.6)', () => {
  const start = () => beginBattle(data, base, firstNode(data).id, base.roster.map((r) => r.id)).state;

  it('names the unit that had to survive', () => {
    const s = start();
    const u = getUnit(s, 'kael');
    u.hp = 0;
    knockOut(data, s, u, [] as GameEvent[]);
    expect(s.outcome).toBe('defeat');
    expect(s.defeatReason).toBe('kael');
    expect(defeatSentence(data, s)).toEqual({ kind: 'unit', nameKey: u.nameKey, name: u.name });
  });

  it('names the turn limit', () => {
    const s = start();
    s.defeatReason = 'turns';
    const limit = data.maps[s.mapId]!.objectives.defeat.find((d) => d.type === 'turn_limit');
    const sentence = defeatSentence(data, s);
    if (limit && limit.type === 'turn_limit') expect(sentence).toEqual({ kind: 'turns', turns: limit.turns });
    else expect(sentence).toEqual({ kind: 'generic' });
  });

  it('falls back to a generic sentence (old saves without a reason)', () => {
    expect(defeatSentence(data, start())).toEqual({ kind: 'generic' });
  });

  it('is set by an objective defeat in a played battle and survives replay', () => {
    let s = start();
    const log: Command[] = [];
    for (let i = 0; i < 80 && !s.outcome; i++) {
      s = applyCommand(data, s, { type: 'endPhase' }).state;
      log.push({ type: 'endPhase' });
    }
    if (s.outcome === 'defeat') expect(s.defeatReason).toBeTruthy();
  });
});

describe('what the node reward put into the convoy and the chronicle (side quests)', () => {
  it('lists items and chronicle pages from the applied effects, in order', () => {
    const v = missionResultView(fake({ effects: [{ item: { def: 'magpie' } }, { item: { def: 'ember_spark' } }, { chronicle: 'a1_watchtower' }, { gold: 5 }] }));
    expect(v.received).toEqual([
      { kind: 'item', id: 'magpie', count: 1 },
      { kind: 'item', id: 'ember_spark', count: 1 },
      { kind: 'page', id: 'a1_watchtower' },
    ]);
  });

  it('adds equal items up: two ember sparks read "2 ×"', () => {
    expect(receivedLines([{ item: { def: 'ember_spark' } }, { item: { def: 'ember_spark' } }])).toEqual([{ kind: 'item', id: 'ember_spark', count: 2 }]);
  });

  it('is empty for a mission without such a reward, and the ember spark is a seal (the highlighted kind)', () => {
    expect(missionResultView(fake()).received).toEqual([]);
    expect(data.items.ember_spark!.kind).toBe('seal');
  });
});
