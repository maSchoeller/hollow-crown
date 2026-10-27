import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import {
  applyCampaign,
  applyCommand,
  applyEffects,
  autoplay,
  beginBattle,
  clone,
  firstNode,
  homeRooms,
  memorialStones,
  newCampaign,
  nextRoomLevel,
  roomUnlocks,
  validateCampaign,
  validateEffects,
  type BattleState,
  type CampaignEvent,
  type CampaignState,
  type Command,
  type Effect,
  type GameData,
} from '../../src/core';
import type { Locales } from '../../src/content/load';

let data: GameData;
let locales: Locales;
let base: CampaignState;

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

const castle = (c: CampaignState): CampaignState => ({ ...clone(c), home: { kind: 'castle', rooms: clone(c.home.rooms) } });
/** Data with a test node reward on the first node (the shipped campaign.yaml stays as it is). */
const withReward = (effects: Effect[]): GameData => {
  const d = structuredClone(data);
  firstNode(d).effects = effects;
  return d;
};
const problems = (d: GameData) => validateContent(d, locales).map((i) => `${i.file}: ${i.message}`);

describe('effect setHome (story 6.9)', () => {
  it('moves the company, the rooms keep their level, one event', () => {
    const c = clone(base);
    c.home.rooms = { smith: 2 };
    const e: Effect[] = [{ setHome: 'castle' }];
    expect(validateEffects(data, c, e)).toBeNull();
    expect(validateCampaign(data, c, { type: 'effects', effects: e })).toBeNull();
    const events: CampaignEvent[] = [];
    const after = clone(c);
    applyEffects(data, after, e, events);
    expect(after.home).toEqual({ kind: 'castle', rooms: { smith: 2 } });
    expect(events).toEqual([{ t: 'homeChanged', home: 'castle' }]);
    // same home again: no fault, no event
    const again: CampaignEvent[] = [];
    applyEffects(data, after, e, again);
    expect(again).toEqual([]);
  });

  it('an unknown kind of home is an invalid effect', () => {
    expect(validateEffects(data, base, [{ setHome: 'tower' } as unknown as Effect])).toBe('effect_invalid');
  });

  it('through the campaign command, twice gives the same result', () => {
    const cmd = { type: 'effects' as const, effects: [{ setHome: 'castle' as const }] };
    const a = applyCampaign(data, base, cmd);
    expect(applyCampaign(data, clone(base), cmd)).toEqual(a);
    expect(a.campaign.home.kind).toBe('castle');
    expect(base.home.kind).toBe('camp');
  });
});

describe('node effects are applied when the mission is won (story 6.9)', () => {
  const start = (d: GameData, c: CampaignState): BattleState => beginBattle(d, c, firstNode(d).id, c.roster.map((r) => r.id)).state;
  /** The player idles until the enemy wins (only hard allows it, like in campaign-commands.test.ts). */
  function lost(d: GameData, c: CampaignState) {
    const s0 = start(d, c);
    let s = s0;
    const log: Command[] = [];
    for (let i = 0; i < 60 && !s.outcome; i++) {
      const cmd: Command = { type: 'endPhase' };
      s = applyCommand(d, s, cmd).state;
      log.push(cmd);
    }
    expect(s.outcome).toBe('defeat');
    return { start: s0, log };
  }

  it('victory: the home changes, the levels stay, the events and the result carry it', () => {
    const d = withReward([{ setHome: 'castle' }]);
    const c = clone(base);
    c.home.rooms = { smith: 2 };
    const s0 = start(d, c);
    const cmd = { type: 'finishMission' as const, start: s0, commands: autoplay(d, s0).log };
    const r = applyCampaign(d, c, cmd);
    expect(applyCampaign(d, clone(c), cmd)).toEqual(r);
    expect(r.campaign.home).toEqual({ kind: 'castle', rooms: { smith: 2 } });
    expect(r.campaign.completed).toContain(firstNode(d).id);
    const names = r.events.map((e) => e.t);
    expect(names).toContain('homeChanged');
    expect(names.indexOf('homeChanged')).toBeLessThan(names.indexOf('missionFinished'));
    const done = r.events.find((e) => e.t === 'missionFinished');
    expect(done && done.t === 'missionFinished' && done.result.effects).toEqual([{ setHome: 'castle' }]);
  });

  it('defeat: nothing of the reward happens', () => {
    const d = withReward([{ setHome: 'castle' }]);
    const hard = newCampaign(d, 7, { difficulty: 'hard', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    const l = lost(d, hard);
    const r = applyCampaign(d, hard, { type: 'finishMission', start: l.start, commands: l.log });
    expect(r.campaign).toEqual(hard);
    expect(r.campaign.home.kind).toBe('camp');
    expect(r.events.some((e) => e.t === 'homeChanged')).toBe(false);
  });

  it('a reward the rules refuse is dropped, the mission still ends', () => {
    const d = withReward([{ gold: -1e9 }, { setHome: 'castle' }]);
    const s0 = start(d, base);
    const r = applyCampaign(d, base, { type: 'finishMission', start: s0, commands: autoplay(d, s0).log });
    expect(r.campaign.completed).toContain(firstNode(d).id);
    expect(r.campaign.home.kind).toBe('camp');
  });

  it('content:check checks the references of a node reward, and accepts setHome', () => {
    expect(problems(withReward([{ setHome: 'castle' }]))).toEqual([]);
    expect(problems(withReward([{ setFlag: 'ghost' }]))).toContainEqual(expect.stringContaining('prologue effects: undeclared flag ghost'));
    expect(problems(withReward([{ recruit: 'ghost' }]))).toContainEqual(expect.stringContaining('unknown companion ghost'));
  });
});

describe('the rooms of the castle (story 6.9)', () => {
  it('lists the castle rooms of act 1, the memorial hall among them, and not the camp', () => {
    const ids = (c: CampaignState) => homeRooms(data, c).map((r) => r.room.id);
    expect(ids(base)).not.toContain('memorial');
    expect(ids(castle(base))).toEqual(['convoy', 'merchant', 'smith', 'healer', 'tavern', 'campfire', 'memorial']);
  });

  it('the build-up of every castle room is locked until act 2, the reason is the act condition', () => {
    const c = castle(base);
    for (const { room } of homeRooms(data, c)) {
      expect(room.levels).toHaveLength(2);
      expect(nextRoomLevel(data, c, room)).toEqual({ level: 2, unmet: { act: 2 } });
    }
  });

  it('with act 2 reached the step is open, at level 3 there is no next step', () => {
    const d = structuredClone(data);
    d.campaign.act = 2;
    const c = castle(base);
    expect(nextRoomLevel(d, c, d.rooms.smith!)).toEqual({ level: 2, unmet: undefined });
    c.home.rooms = { smith: 3 };
    expect(nextRoomLevel(d, c, d.rooms.smith!)).toBeNull();
    // a room without levels has no step at all
    d.rooms.smith!.levels = [];
    expect(nextRoomLevel(d, castle(base), d.rooms.smith!)).toBeNull();
  });

  it('the lessons of the memorial hall are locked until act 2', () => {
    const room = data.rooms.memorial!;
    expect(roomUnlocks(data, castle(base), room)).toEqual([{ id: 'lessons', open: false, unmet: { act: 2 } }]);
    const d = structuredClone(data);
    d.campaign.act = 2;
    expect(roomUnlocks(d, castle(base), d.rooms.memorial!)).toEqual([{ id: 'lessons', open: true, unmet: undefined }]);
  });
});

describe('memorial stones (story 6.9)', () => {
  const fall = (c: CampaignState, id: string, extra: Partial<CampaignState['fallen'][number]> = {}) =>
    c.fallen.push({ id, nameKey: `unit.${id}.name`, node: 'm1_2', classId: 'fighter', portrait: id, ...extra });

  it('Gerrit stands once the prologue is done, before everyone who fell', () => {
    expect(memorialStones(data, base)).toEqual([]);
    const c = clone(base);
    c.completed.push('prologue');
    const stones = memorialStones(data, c);
    expect(stones.map((s) => s.key)).toEqual(['fixed:gerrit']);
    expect(stones[0]).toMatchObject({ kind: 'fixed', nameKey: 'memorial.gerrit.name', placeKey: 'memorial.gerrit.place', roleKey: 'memorial.gerrit.role', quoteKey: 'memorial.gerrit.quote', portrait: 'gerrit', mercenary: false });
  });

  it('the fallen follow in the order they fell, mercenaries included; the quote is the last line of the farewell scene', () => {
    const c = clone(base);
    c.completed.push('prologue');
    fall(c, 'fenn');
    fall(c, 'merc7', { nameKey: 'merc.name.5', name: 'Wulf', mercenary: true, portrait: undefined });
    fall(c, 'mira', { node: 'm1_3' });
    const stones = memorialStones(data, c);
    expect(stones.map((s) => s.key)).toEqual(['fixed:gerrit', 'fallen:fenn', 'fallen:merc7', 'fallen:mira']);
    expect(stones[1]).toMatchObject({ kind: 'fallen', node: 'm1_2', classId: 'fighter', mercenary: false, quoteKey: 'dlg.scn.farewell.fenn.last' });
    // a mercenary has no quote, however the scene might read
    expect(stones[2]).toMatchObject({ mercenary: true, name: 'Wulf' });
    expect(stones[2]!.quoteKey).toBeUndefined();
    expect(stones[3]!.quoteKey).toBe('dlg.scn.farewell.mira.last');
  });

  it('a companion without a farewell scene gets a stone without a quote', () => {
    const c = clone(base);
    fall(c, 'nobody');
    expect(memorialStones(data, c)[0]!.quoteKey).toBeUndefined();
  });

  it('the stones need no state of their own: nothing but the campaign goes in', () => {
    const c = clone(base);
    c.completed.push('prologue');
    fall(c, 'fenn');
    expect(memorialStones(data, clone(c))).toEqual(memorialStones(data, c));
  });
});

describe('content:check of the home, the rooms and the memorial stones (story 6.9)', () => {
  const places = new Set(['lager_unterwegs', 'paktwacht_ruine', 'varnhold']);
  const check = (d: GameData, p: Set<string> | undefined = places) => validateContent(d, locales, undefined, undefined, p).map((i) => `${i.file}: ${i.message}`);

  it('accepts the shipped content', () => {
    expect(check(data).filter((m) => m.includes('home') || m.includes('memorial') || m.includes('rooms.yaml'))).toEqual([]);
  });

  it('an anchor needs a room that exists and belongs to that home', () => {
    const d = structuredClone(data);
    d.home.castle.anchors.push({ room: 'ghost', at: [10, 10] });
    expect(check(d)).toContainEqual('home/home.yaml: castle: anchor for unknown room ghost');
    const e = structuredClone(data);
    e.home.camp.anchors.push({ room: 'memorial', at: [10, 10] });
    expect(check(e)).toContainEqual('home/home.yaml: camp: room memorial does not belong to this home');
    const f = structuredClone(data);
    f.home.castle.anchors.push({ room: 'smith', at: [1, 1] });
    expect(check(f)).toContainEqual('home/home.yaml: castle: room smith is anchored twice');
  });

  it('the picture of a home must exist', () => {
    const d = structuredClone(data);
    d.home.castle.image = 'nowhere';
    expect(check(d)).toContainEqual('home/home.yaml: castle: no place image art/mockups/locations-s1/nowhere.png');
  });

  it('conditions of levels, unlocks and memorial stones are checked, texts must exist in both languages', () => {
    const d = structuredClone(data);
    d.rooms.smith!.levels[0]!.requires = [{ completed: 'm9_9' }];
    d.rooms.memorial!.unlocks[0]!.requires = [{ alive: 'ghost' }];
    d.memorials.gerrit!.requires = [{ completed: 'm9_8' }];
    d.memorials.extra = { id: 'extra', act: 1, portrait: 'gerrit', name: 'X', place: 'Y', role: 'Z', quote: 'Q', requires: [] };
    const out = check(d);
    expect(out).toContainEqual(expect.stringContaining('smith.levels[0].requires: unknown node m9_9'));
    expect(out).toContainEqual(expect.stringContaining('memorial.unlocks.lessons.requires: unknown companion ghost'));
    expect(out).toContainEqual(expect.stringContaining('gerrit.requires: unknown node m9_8'));
    expect(out).toContainEqual(expect.stringContaining('missing key memorial.extra.name'));
  });
});
