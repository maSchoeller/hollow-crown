import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCampaign, replayCampaign, type CampaignCommand, type GameData } from '../../src/core';
import {
  appendJournal,
  createJournalWriter,
  journalSinceCheckpoint,
  needsUpdateCheckpoint,
  readJournal,
} from '../../src/persistence/journal';
import { APP_VERSION, closeSaveDb, createCampaign, deleteCampaign, type SaveRecord } from '../../src/persistence/save';

const format2 = JSON.parse(readFileSync(join(process.cwd(), 'tests/fixtures/saves/format2-auto.json'), 'utf8')) as SaveRecord;
const start = format2.payload.campaign;
let data: GameData;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

beforeEach(async () => {
  await closeSaveDb();
  globalThis.indexedDB = new IDBFactory();
});

async function campaignId(): Promise<string> {
  return (await createCampaign({ campaign: start, now: '2026-10-24T10:00:00.000Z', contentVersion: 'cv1' })).id;
}

describe('journal', () => {
  it('numbers entries per campaign and keeps their order', async () => {
    const a = await campaignId();
    const b = await campaignId();
    const w = createJournalWriter();
    void w.append(a, { kind: 'checkpoint', reason: 'new', contentVersion: 'cv1', campaign: start });
    void w.append(a, { kind: 'command', cmd: { type: 'setFlag', flag: 'x' } });
    void w.append(b, { kind: 'checkpoint', reason: 'new', contentVersion: 'cv1', campaign: start });
    void w.append(a, { kind: 'command', cmd: { type: 'setFlag', flag: 'y' } });
    await w.flush();
    const ja = await readJournal(a);
    expect(ja.map((e) => e.seq)).toEqual([0, 1, 2]);
    expect(ja.map((e) => e.kind)).toEqual(['checkpoint', 'command', 'command']);
    expect((await readJournal(b)).map((e) => e.seq)).toEqual([0]);
    const cp = ja[0]!;
    expect(cp.kind === 'checkpoint' && cp.appVersion).toBe(APP_VERSION);
  });

  it('replays from the last checkpoint to the live state', async () => {
    const id = await campaignId();
    const cmds: CampaignCommand[] = [
      { type: 'setFlag', flag: 'before' },
      { type: 'buy', item: 'iron_sword' },
    ];
    let live = start;
    await appendJournal(id, { kind: 'checkpoint', reason: 'new', contentVersion: 'cv1', campaign: live });
    for (const cmd of cmds) {
      live = applyCampaign(data, live, cmd).campaign;
      await appendJournal(id, { kind: 'command', cmd });
    }
    // an app update: checkpoint, then more commands
    await appendJournal(id, { kind: 'checkpoint', reason: 'update', contentVersion: 'cv2', campaign: live });
    const after: CampaignCommand = { type: 'setFlag', flag: 'after' };
    live = applyCampaign(data, live, after).campaign;
    await appendJournal(id, { kind: 'command', cmd: after });

    const tail = (await journalSinceCheckpoint(id))!;
    expect(tail.checkpoint.reason).toBe('update');
    expect(tail.commands).toEqual([after]);
    expect(replayCampaign(data, tail.checkpoint.campaign, tail.commands)).toEqual(live);
  });

  it('asks for an update checkpoint when the content version changed', async () => {
    const id = await campaignId();
    expect(await needsUpdateCheckpoint(id, 'cv1')).toBe(true); // no checkpoint yet
    await appendJournal(id, { kind: 'checkpoint', reason: 'new', contentVersion: 'cv1', campaign: start });
    expect(await needsUpdateCheckpoint(id, 'cv1')).toBe(false);
    expect(await needsUpdateCheckpoint(id, 'cv2')).toBe(true);
  });

  it('a failed write does not stop later ones', async () => {
    const id = await campaignId();
    const errors: unknown[] = [];
    const w = createJournalWriter((e) => errors.push(e));
    void w.append(id, { kind: 'command', cmd: { type: 'setFlag', flag: 'ok' } });
    // not serialisable → the write fails
    void w.append(id, { kind: 'command', cmd: { type: 'setFlag', flag: 1n as unknown as string } });
    void w.append(id, { kind: 'command', cmd: { type: 'setFlag', flag: 'later' } });
    await w.flush();
    expect((await readJournal(id)).map((e) => e.kind === 'command' && e.cmd)).toEqual([
      { type: 'setFlag', flag: 'ok' },
      { type: 'setFlag', flag: 'later' },
    ]);
    expect(errors).toHaveLength(1);
  });

  it('is removed with its campaign', async () => {
    const id = await campaignId();
    await appendJournal(id, { kind: 'checkpoint', reason: 'new', contentVersion: 'cv1', campaign: start });
    await deleteCampaign(id);
    expect(await readJournal(id)).toEqual([]);
    expect(await journalSinceCheckpoint(id)).toBeNull();
  });
});
