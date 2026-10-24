import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  applyCommand,
  beginBattle,
  clone,
  newCampaign,
  replayBattle,
  restartKeep,
  turnStartIndex,
  validateCampaign,
  type BattleState,
  type CampaignState,
  type Command,
  type DeathMode,
  type GameData,
} from '../../src/core';
import { exportSave, importSave, MAX_IMPORT_BYTES, SlotNotAllowedError, writeSave, closeSaveDb, createCampaign, type SaveRecord } from '../../src/persistence/save';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let data: GameData;
const campaignOf = (deathMode: DeathMode): CampaignState =>
  newCampaign(data, 7, { difficulty: 'hard', deathMode }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });

beforeAll(() => {
  data = loadContentFromDisk().data;
});

/** Player idles until the enemy wins (or the cap); returns start and log. */
function lostBattle(c: CampaignState): { start: BattleState; log: Command[]; state: BattleState } {
  const start = beginBattle(data, c, data.campaign.start, c.roster.map((r) => r.id)).state;
  let state = start;
  const log: Command[] = [];
  for (let i = 0; i < 60 && !state.outcome; i++) {
    const cmd: Command = { type: 'endPhase' };
    state = applyCommand(data, state, cmd).state;
    log.push(cmd);
  }
  return { start, log, state };
}

describe('turn start index', () => {
  it('is the length of the log up to and including the last endPhase', () => {
    const a = { type: 'move' } as Command;
    const e = { type: 'endPhase' } as Command;
    expect(turnStartIndex([])).toBe(0);
    expect(turnStartIndex([a, a])).toBe(0);
    expect(turnStartIndex([a, e, a, a])).toBe(2);
    expect(restartKeep('turn', [a, e, a, a])).toBe(2);
    expect(restartKeep('mission', [a, e, a, a])).toBe(0);
  });
});

describe('restartTurn / restartMission (story 1.5)', () => {
  it('are allowed in Standard and Casual and tell how much of the log to keep', () => {
    for (const mode of ['standard', 'casual'] as const) {
      const c = campaignOf(mode);
      const start = beginBattle(data, c, data.campaign.start, c.roster.map((r) => r.id)).state;
      const commands: Command[] = [{ type: 'endPhase' }, { type: 'endPhase' }];
      const turn = applyCampaign(data, c, { type: 'restartTurn', start, commands });
      expect(turn.events).toEqual([{ t: 'battleRestarted', scope: 'turn', keep: 2 }]);
      expect(turn.campaign).toEqual(c);
      const mission = applyCampaign(data, c, { type: 'restartMission', start, commands });
      expect(mission.events).toEqual([{ t: 'battleRestarted', scope: 'mission', keep: 0 }]);
    }
  });

  it('Classic refuses restartTurn always and restartMission unless the battle is lost', () => {
    const c = campaignOf('classic');
    const start = beginBattle(data, c, data.campaign.start, c.roster.map((r) => r.id)).state;
    expect(validateCampaign(data, c, { type: 'restartTurn', start, commands: [] })).toBe('restart_forbidden');
    expect(validateCampaign(data, c, { type: 'restartMission', start, commands: [] })).toBe('restart_forbidden');
    const lost = lostBattle(c);
    expect(lost.state.outcome).toBe('defeat');
    expect(validateCampaign(data, c, { type: 'restartTurn', start: lost.start, commands: lost.log })).toBe('restart_forbidden');
    expect(validateCampaign(data, c, { type: 'restartMission', start: lost.start, commands: lost.log })).toBeNull();
    expect(() => applyCampaign(data, c, { type: 'restartTurn', start, commands: [] })).toThrow();
  });

  it('refuse a battle of a node that is not available', () => {
    const c = campaignOf('standard');
    const start = beginBattle(data, c, data.campaign.start, c.roster.map((r) => r.id)).state;
    const off = { ...clone(c), available: [] };
    expect(validateCampaign(data, off, { type: 'restartTurn', start, commands: [] })).toBe('node_unavailable');
  });

  it('a restart undoes downs and deaths by replaying the shorter log', () => {
    const c = campaignOf('standard');
    const lost = lostBattle(c);
    const back = replayBattle(data, lost.start, lost.log.slice(0, restartKeep('mission', lost.log)));
    expect(back).toEqual(lost.start);
    expect(back.outcome).toBeNull();
    expect(back.units.every((u) => !u.downed && !u.gone)).toBe(true);
  });
});

describe('manual slots and import (story 1.5)', () => {
  const format2 = JSON.parse(readFileSync(join(process.cwd(), 'tests/fixtures/saves/format2-auto.json'), 'utf8')) as SaveRecord;

  it('writeSave refuses manual slots in Classic and during a battle, but not the auto slot', async () => {
    await closeSaveDb();
    globalThis.indexedDB = new IDBFactory();
    const classic = { ...clone(format2.payload.campaign), settings: { difficulty: 'normal' as const, deathMode: 'classic' as const } };
    const meta = await createCampaign({ campaign: classic, now: '2026-10-24T10:00:00.000Z', contentVersion: 'cv' });
    const o = { now: '2026-10-24T10:00:00.000Z', contentVersion: 'cv' };
    await expect(writeSave(meta.id, '1', { campaign: classic, screen: 'camp' }, o)).rejects.toBeInstanceOf(SlotNotAllowedError);
    await expect(writeSave(meta.id, 'auto', { campaign: classic, screen: 'camp' }, o)).resolves.toBeDefined();
    const standard = clone(format2.payload.campaign);
    standard.settings.deathMode = 'standard';
    await expect(writeSave(meta.id, '2', { campaign: standard, screen: 'camp' }, o)).resolves.toBeDefined();
    await expect(writeSave(meta.id, '3', { ...format2.payload, campaign: standard }, o)).rejects.toMatchObject({ reason: 'in_battle' });
  });

  it('import refuses oversize files, shape errors and tampering with a one-word reason', () => {
    expect(importSave(exportSave(format2)).campaignId).toBe(format2.campaignId);
    expect(() => importSave('x'.repeat(MAX_IMPORT_BYTES + 1))).toThrow('size');
    expect(() => importSave('not json')).toThrow('format');
    const broken = { ...format2, payload: { ...format2.payload, campaign: { ...format2.payload.campaign, roster: 'nope' } } };
    expect(() => importSave(exportSave(broken as unknown as SaveRecord))).toThrow('content');
    const noSlot = { ...format2, slot: 'x' };
    expect(() => importSave(exportSave(noSlot as unknown as SaveRecord))).toThrow('content');
  });
});
