import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { createLog, LOG_CAPACITY } from '../../src/app/log';
import { assembleReport, REPORT_FORMAT } from '../../src/app/report';
import {
  applyCampaign,
  applyCommand,
  beginBattle,
  CoreInvariantError,
  getUnit,
  newCampaign,
  type BattleState,
  type CampaignState,
  type GameData,
} from '../../src/core';

let data: GameData;
let campaign: CampaignState;
let battle: BattleState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  campaign = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, {
    name: 'Rhen',
    pronoun: 'they',
    portrait: 'avatar_a',
    affinity: 'wind',
  });
  battle = beginBattle(data, campaign, data.campaign.start, ['kael']).state;
});

describe('CoreInvariantError', () => {
  it('carries a code and details and says both in the message', () => {
    const e = new CoreInvariantError('unknown_unit', { uid: 'x' });
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('CoreInvariantError');
    expect(e.code).toBe('unknown_unit');
    expect(e.details).toEqual({ uid: 'x' });
    expect(e.message).toContain('unknown_unit');
    expect(e.message).toContain('"uid":"x"');
    expect(new CoreInvariantError('plain').message).toBe('plain');
  });

  it('is thrown where the core meets an impossible state or an unvalidated command', () => {
    expect(() => getUnit(battle, 'nobody')).toThrow(CoreInvariantError);
    expect(() => applyCommand(data, battle, { type: 'move', unit: 'nobody', to: [0, 0] })).toThrow(CoreInvariantError);
    try {
      applyCommand(data, battle, { type: 'move', unit: 'nobody', to: [0, 0] });
    } catch (e) {
      expect((e as CoreInvariantError).code).toBe('invalid_command');
      expect((e as CoreInvariantError).details).toEqual({ command: 'move', reason: 'unknown_unit' });
    }
    expect(() => applyCampaign(data, { ...campaign, gold: 0 }, { type: 'buy', item: 'iron_sword' })).toThrow(CoreInvariantError);
  });
});

describe('log ring buffer', () => {
  const fixed = () => '2026-10-24T10:00:00.000Z';

  it('keeps the newest 500 entries, oldest first', () => {
    const log = createLog({ now: fixed });
    for (let i = 0; i < LOG_CAPACITY + 25; i++) log.info('ui', `m${i}`);
    const e = log.entries();
    expect(e).toHaveLength(LOG_CAPACITY);
    expect(e[0]!.msg).toBe('m25');
    expect(e.at(-1)!.msg).toBe(`m${LOG_CAPACITY + 24}`);
  });

  it('writes the entry format { t, level, area, msg, data? }', () => {
    const log = createLog({ now: fixed });
    log.warn('save', 'slow', { ms: 900 });
    log.error('core', 'boom');
    expect(log.entries()).toEqual([
      { t: fixed(), level: 'warn', area: 'save', msg: 'slow', data: { ms: 900 } },
      { t: fixed(), level: 'error', area: 'core', msg: 'boom' },
    ]);
  });

  it('drops debug entries unless debug is on', () => {
    const quiet = createLog({ now: fixed });
    quiet.debug('render', 'frame');
    expect(quiet.entries()).toEqual([]);
    const loud = createLog({ now: fixed, debug: true });
    loud.debug('render', 'frame');
    expect(loud.entries()).toHaveLength(1);
  });

  it('copies data and turns errors into plain parts', () => {
    const log = createLog({ now: fixed });
    const data = { n: 1 };
    log.info('ui', 'x', data);
    data.n = 2;
    log.error('core', 'y', new CoreInvariantError('c', { a: 1 }));
    const [a, b] = log.entries();
    expect(a!.data).toEqual({ n: 1 });
    expect(b!.data).toMatchObject({ name: 'CoreInvariantError', message: 'c {"a":1}' });
    log.clear();
    expect(log.entries()).toEqual([]);
  });
});

describe('bug report', () => {
  const base = {
    now: '2026-10-24T10:00:00.000Z',
    appVersion: '0.1.0',
    contentVersion: 'cv1',
    device: { userAgent: 'UA', quality: 'mid' },
    campaignId: 'c1',
  };

  it('assembles versions, device, checkpoint, journal, battle and log', () => {
    const log = createLog({ now: () => base.now });
    log.error('core', 'boom');
    const cp = { kind: 'checkpoint', seq: 3 };
    const r = assembleReport({
      ...base,
      error: new CoreInvariantError('invalid_command', { command: 'move', reason: 'unknown_unit' }),
      campaign,
      journal: { checkpoint: cp, commands: [{ type: 'effects', effects: [{ setFlag: 'x' }] }] },
      battle: { start: battle, commands: [{ type: 'endPhase' }] },
      log: log.entries(),
    });
    expect(r.format).toBe(REPORT_FORMAT);
    expect(r).toMatchObject({ appVersion: '0.1.0', contentVersion: 'cv1', device: { userAgent: 'UA', quality: 'mid' }, checkpoint: cp });
    expect(r.error).toMatchObject({ name: 'CoreInvariantError', code: 'invalid_command', details: { command: 'move', reason: 'unknown_unit' } });
    expect(r.journal).toHaveLength(1);
    expect(r.battle!.commands).toEqual([{ type: 'endPhase' }]);
    expect(r.log).toHaveLength(1);
    expect(JSON.parse(JSON.stringify(r))).toMatchObject({ campaignId: 'c1' });
  });

  it('copes with no journal, no battle and a non-error value; keeps only the last 500 log lines', () => {
    const log = createLog({ now: () => base.now, capacity: 800 });
    for (let i = 0; i < 700; i++) log.info('ui', `m${i}`);
    const r = assembleReport({ ...base, error: 'oops', campaign: null, journal: null, battle: null, log: log.entries() });
    expect(r.error).toEqual({ name: 'Unknown', message: 'oops' });
    expect(r.checkpoint).toBeNull();
    expect(r.journal).toEqual([]);
    expect(r.battle).toBeNull();
    expect(r.log).toHaveLength(LOG_CAPACITY);
    expect(r.log.at(-1)!.msg).toBe('m699');
  });
});
