import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  applyCommand,
  autoCommand,
  beginBattle,
  clone,
  firstNode,
  newCampaign,
  stateHash,
  type BattleState,
  type CampaignCommand,
  type CampaignState,
  type Command,
  type GameData,
} from '../../src/core';
import { assembleReport, REPORT_VERSION, type BugReport } from '../../src/app/report';
import { compactCommand, createTrail, screenInfo, TRAIL_MAX_EVENTS, trailEvents, type TrailEntry, type TrailStore } from '../../src/app/trail';
import { closeTrailDb, createTrailStore } from '../../src/persistence/trail';
import { checkBattle, checkCampaign, describeEntry } from '../../tools/reportCheck';

let data: GameData;
let campaign: CampaignState;
let start: BattleState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  campaign = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  start = beginBattle(data, campaign, firstNode(data).id, ['kael']).state;
});

const fixed = () => '2026-10-30T12:00:00.000Z';

/** A store in memory that can be told to fail. */
function memoryStore() {
  const kept: TrailEntry[] = [];
  const s = {
    kept,
    fail: false,
    writes: 0,
    async write(entries: TrailEntry[]) {
      if (s.fail) throw new Error('disk full');
      s.writes++;
      kept.push(...entries);
    },
    async read() {
      if (s.fail) throw new Error('disk full');
      return kept.slice();
    },
    async clear() {
      kept.length = 0;
    },
  } satisfies TrailStore & Record<string, unknown>;
  return s;
}

describe('stateHash', () => {
  it('is 8 hex digits, the same for the same state and different after a change', () => {
    const h = stateHash(start);
    expect(h).toMatch(/^[0-9a-f]{8}$/);
    expect(stateHash(clone(start))).toBe(h);
    expect(stateHash({ ...start, turn: start.turn + 1 })).not.toBe(h);
    expect(stateHash(undefined)).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('action trail', () => {
  it('numbers entries, stamps run and time, and keeps a copy', () => {
    const trail = createTrail({ run: 'r1', now: fixed });
    const changed = { quality: 'low' };
    const e = trail.record({ kind: 'settings', changed });
    changed.quality = 'high';
    trail.record({ kind: 'screen', screen: { name: 'title' } });
    expect(e).toEqual({ kind: 'settings', changed: { quality: 'low' }, n: 0, run: 'r1', t: fixed() });
    expect(trail.recent().map((x) => x.n)).toEqual([0, 1]);
  });

  it('keeps only the last `capacity` entries', async () => {
    const trail = createTrail({ capacity: 3 });
    for (let i = 0; i < 5; i++) trail.record({ kind: 'screen', screen: { name: `s${i}` } });
    expect(trail.recent().map((e) => e.n)).toEqual([2, 3, 4]);
    expect((await trail.entries()).length).toBe(3);
  });

  it('writes in batches and reads earlier app starts back before this one', async () => {
    const store = memoryStore();
    store.kept.push({ kind: 'screen', screen: { name: 'old' }, n: 7, run: 'r0', t: fixed() });
    const trail = createTrail({ run: 'r1', store, flushMs: 60_000 });
    trail.record({ kind: 'screen', screen: { name: 'a' } });
    trail.record({ kind: 'screen', screen: { name: 'b' } });
    expect(store.writes).toBe(0);
    const all = await trail.entries();
    expect(store.writes).toBe(1);
    expect(all.map((e) => `${e.run}:${e.n}`)).toEqual(['r0:7', 'r1:0', 'r1:1']);
  });

  it('a failing store is reported and the entries stay in memory', async () => {
    const store = memoryStore();
    const errors: unknown[] = [];
    const trail = createTrail({ run: 'r1', store, flushMs: 60_000, onError: (e) => errors.push(e) });
    store.fail = true;
    trail.record({ kind: 'screen', screen: { name: 'a' } });
    await trail.flush();
    expect(errors.length).toBe(1);
    expect((await trail.entries()).map((e) => e.n)).toEqual([0]);
    // the next write takes the failed entries along, in order
    store.fail = false;
    trail.record({ kind: 'screen', screen: { name: 'b' } });
    expect((await trail.entries()).map((e) => e.n)).toEqual([0, 1]);
    expect(store.kept.map((e) => e.n)).toEqual([0, 1]);
  });

  it('attach writes what was recorded before; clear empties memory and store', async () => {
    const store = memoryStore();
    const trail = createTrail({ run: 'r1', flushMs: 60_000 });
    trail.record({ kind: 'screen', screen: { name: 'title' } });
    trail.attach(store);
    await trail.flush();
    expect(store.kept.map((e) => e.n)).toEqual([0]);
    await trail.clear();
    expect(store.kept).toEqual([]);
    expect(await trail.entries()).toEqual([]);
  });

  it('cuts long event lists and says how many there were', () => {
    const many = Array.from({ length: TRAIL_MAX_EVENTS + 5 }, (_, i) => ({ t: `e${i}` }));
    expect(trailEvents(many.slice(0, 3))).toEqual({ events: many.slice(0, 3) });
    const cut = trailEvents(many);
    expect(cut.events.length).toBe(TRAIL_MAX_EVENTS);
    expect(cut.eventCount).toBe(TRAIL_MAX_EVENTS + 5);
  });

  it('compacts the battle logs inside campaign commands', () => {
    const cmds: Command[] = [{ type: 'endPhase' }];
    expect(compactCommand({ type: 'finishMission', start, commands: cmds })).toEqual({ type: 'finishMission', start: `#${stateHash(start)}`, commands: 1 });
    expect(compactCommand({ type: 'restartMission', node: 'n', lost: { start, commands: cmds } })).toEqual({
      type: 'restartMission',
      node: 'n',
      lost: { start: `#${stateHash(start)}`, commands: 1 },
    });
    expect(compactCommand({ type: 'abandonMission', node: 'n', commands: cmds })).toEqual({ type: 'abandonMission', node: 'n', commands: 1 });
    const buy: CampaignCommand = { type: 'buy', item: 'iron_sword' };
    expect(compactCommand(buy)).toEqual(buy);
  });

  it('keeps only the simple parameters of a screen', () => {
    expect(screenInfo({ name: 'dialogue', id: 'scn.x', next: () => undefined } as { name: string })).toEqual({ name: 'dialogue', id: 'scn.x' });
    expect(screenInfo({ name: 'options', back: { name: 'battle' } } as { name: string })).toEqual({ name: 'options', back: 'battle' });
    expect(screenInfo({ name: 'result', result: { gold: 3 } } as { name: string })).toEqual({ name: 'result' });
  });
});

describe('trail store (IndexedDB)', () => {
  beforeEach(async () => {
    await closeTrailDb();
    globalThis.indexedDB = new IDBFactory();
  });

  it('keeps the newest entries up to the capacity, in order, and clears', async () => {
    const store = createTrailStore<TrailEntry>(3);
    const e = (n: number): TrailEntry => ({ kind: 'screen', screen: { name: 'x' }, n, run: 'r', t: fixed() });
    await store.write([e(0), e(1)]);
    await store.write([e(2), e(3), e(4)]);
    expect((await store.read()).map((x) => x.n)).toEqual([2, 3, 4]);
    await store.clear();
    expect(await store.read()).toEqual([]);
  });
});

describe('bug report version 2', () => {
  const base = {
    now: fixed(),
    appVersion: 'abc',
    contentVersion: 'c1',
    device: { userAgent: 'test', quality: 'mid' },
    campaignId: null,
    campaign: null,
    journal: null,
    battle: null,
    log: [],
  };

  it('a report from the options has no error, carries the note, the screen and the trail', () => {
    const trail = createTrail({ run: 'r1', now: fixed });
    trail.record({ kind: 'screen', screen: { name: 'worldmap' } });
    const r = assembleReport({ ...base, reason: 'manual', note: '  Kael did no damage  ', error: null, screen: { name: 'battle' }, trail: trail.recent() });
    expect(r.version).toBe(REPORT_VERSION);
    expect(r.reason).toBe('manual');
    expect(r.error).toBeNull();
    expect(r.note).toBe('Kael did no damage');
    expect(r.screen).toEqual({ name: 'battle' });
    expect(r.trail.length).toBe(1);
    expect(r.history).toEqual([]);
  });

  it('the history shows the whole journal without states and battle logs', () => {
    const r = assembleReport({
      ...base,
      error: new Error('x'),
      history: [
        { seq: 0, kind: 'checkpoint', reason: 'new', appVersion: 'abc', contentVersion: 'c1' },
        { seq: 1, kind: 'command', cmd: { type: 'finishMission', start, commands: [{ type: 'endPhase' }] } },
      ],
    });
    expect(r.reason).toBe('fault');
    expect(r.error).toMatchObject({ name: 'Error', message: 'x' });
    expect(r.history).toEqual([
      { seq: 0, kind: 'checkpoint', reason: 'new', appVersion: 'abc', contentVersion: 'c1' },
      { seq: 1, kind: 'command', cmd: { type: 'finishMission', start: `#${stateHash(start)}`, commands: 1 } },
    ]);
  });
});

/** Plays `n` commands like the app does and records them in a trail; returns the report parts. */
function playedBattle(n: number) {
  const trail = createTrail({ run: 'r1', now: fixed });
  trail.record({ kind: 'battleStart', node: start.nodeId, deploy: ['kael'], hash: stateHash(start) });
  let s = start;
  const commands: Command[] = [];
  for (let i = 0; i < n && !s.outcome; i++) {
    const cmd = autoCommand(data, s);
    const r = applyCommand(data, s, cmd);
    trail.record({ kind: 'battle', i, turn: s.turn, phase: s.phase, cmd, ok: true, ...trailEvents(r.events), hash: stateHash(r.state) });
    s = r.state;
    commands.push(cmd);
  }
  return { battle: { start, commands }, trail: trail.recent() };
}

describe('pnpm report checks', () => {
  it('a battle that replays the same passes, with every command checked', () => {
    const r = checkBattle(data, playedBattle(6));
    expect(r.status).toBe('ok');
    expect(r.detail).toContain('6 checked');
  });

  it('finds the first command whose state differs from the device', () => {
    const p = playedBattle(6);
    const trail = p.trail.map((e) => (e.kind === 'battle' && e.i === 3 ? { ...e, hash: '00000000' } : e));
    expect(checkBattle(data, { ...p, trail })).toMatchObject({ status: 'diverged', at: 3 });
  });

  it('reports a command that no longer replays', () => {
    const p = playedBattle(4);
    const commands: Command[] = [...p.battle.commands.slice(0, 2), { type: 'move', unit: 'nobody', to: [0, 0] }];
    expect(checkBattle(data, { ...p, battle: { start, commands } })).toMatchObject({ status: 'failed', at: 2 });
    expect(checkBattle(data, { battle: null, trail: [] }).status).toBe('unchecked');
  });

  it('replays the campaign from the checkpoint to the state in the report', () => {
    const c = clone(campaign);
    c.gold = 10000;
    const journal: CampaignCommand[] = [
      { type: 'buy', item: 'iron_sword' },
      { type: 'buy', item: 'iron_sword' },
    ];
    let now = c;
    const trail = createTrail({ run: 'r1' });
    for (const cmd of journal) {
      now = applyCampaign(data, now, cmd).campaign;
      trail.record({ kind: 'campaign', cmd: compactCommand(cmd), ok: true, hash: stateHash(now) });
    }
    const report: Pick<BugReport, 'checkpoint' | 'journal' | 'campaign' | 'appVersion' | 'trail'> = {
      checkpoint: { campaign: c, appVersion: 'abc' },
      journal,
      campaign: now,
      appVersion: 'abc',
      trail: trail.recent(),
    };
    expect(checkCampaign(data, report).status).toBe('ok');
    expect(checkCampaign(data, { ...report, campaign: { ...now, gold: 1 } })).toMatchObject({ status: 'diverged' });
    expect(checkCampaign(data, { ...report, checkpoint: null }).status).toBe('unchecked');
  });

  it('describes every kind of entry as one line', () => {
    const p = playedBattle(2);
    const trail = createTrail({ run: 'r1', now: fixed });
    trail.record({ kind: 'app', appVersion: 'abc', contentVersion: 'c1', device: { userAgent: 'x' } });
    trail.record({ kind: 'screen', screen: { name: 'worldmap' } });
    trail.record({ kind: 'load', reason: 'load', campaignId: 'c-1', battle: true });
    trail.record({ kind: 'campaign', cmd: { type: 'buy', item: 'iron_sword' }, ok: false, error: 'not_enough_gold' });
    trail.record({ kind: 'effects', queued: false, error: 'effect_invalid', effects: [] });
    trail.record({ kind: 'settings', changed: { quality: 'low' } });
    trail.record({ kind: 'fault', name: 'CoreInvariantError', code: 'unknown_unit', message: 'unknown_unit' });
    const lines = [...p.trail, ...trail.recent()].map(describeEntry);
    expect(lines[0]).toContain('BATTLE START');
    expect(lines[1]).toMatch(/battle\[0\] T1 player \w+/);
    expect(lines.join('\n')).toContain('REFUSED not_enough_gold');
    expect(lines.join('\n')).toContain('FAULT CoreInvariantError unknown_unit');
    expect(lines.every((l) => l.startsWith('12:00:00 #'))).toBe(true);
  });
});
