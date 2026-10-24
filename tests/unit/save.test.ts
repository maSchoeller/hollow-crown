import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { openDB } from 'idb';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCommand, type CampaignState } from '../../src/core';
import { createAutoSaver, createPlayClock } from '../../src/persistence/autosave';
import {
  CampaignLimitError,
  closeSaveDb,
  createCampaign,
  DB_NAME,
  DB_VERSION,
  deleteCampaign,
  exportSave,
  importSave,
  listCampaigns,
  listLegacy,
  listSaves,
  MAX_CAMPAIGNS,
  readSave,
  writeSave,
  type LegacyRecord,
  type SaveRecord,
} from '../../src/persistence/save';

const fixture = <T>(name: string): T =>
  JSON.parse(readFileSync(join(process.cwd(), 'tests/fixtures/saves', name), 'utf8')) as T;
const format1 = fixture<LegacyRecord>('format1-auto.json');
const format2 = fixture<SaveRecord>('format2-auto.json');
const opts = (now: string, playtimeDeltaMs = 0) => ({ now, contentVersion: 'cv1', playtimeDeltaMs });

beforeEach(async () => {
  await closeSaveDb();
  globalThis.indexedDB = new IDBFactory();
});

async function newCampaignMeta(c: CampaignState = format2.payload.campaign, now = '2026-10-23T10:00:00.000Z') {
  return createCampaign({ campaign: c, now, contentVersion: 'cv1' });
}

describe('save format 2 (concept/24 §5.15)', () => {
  it('creates version 2 with campaigns, saves, journal and legacy', async () => {
    expect(await listCampaigns()).toEqual([]);
    await closeSaveDb();
    const d = await openDB(DB_NAME);
    expect(d.version).toBe(DB_VERSION);
    expect([...d.objectStoreNames].sort()).toEqual(['campaigns', 'journal', 'legacy', 'saves']);
    expect(d.transaction('saves').store.keyPath).toEqual(['campaignId', 'slot']);
    expect(d.transaction('journal').store.keyPath).toEqual(['campaignId', 'seq']);
    d.close();
  });

  it('moves format-1 saves unchanged to legacy on upgrade from version 1', async () => {
    const v1 = await openDB(DB_NAME, 1, { upgrade: (d) => void d.createObjectStore('saves', { keyPath: 'slot' }) });
    await v1.put('saves', format1);
    await v1.put('saves', { ...format1, slot: '2' });
    v1.close();
    const legacy = await listLegacy();
    expect(legacy).toHaveLength(2);
    expect(legacy.find((r) => r.slot === 'auto')).toEqual(format1);
    expect(await listCampaigns()).toEqual([]);
    // legacy saves stay exportable
    expect(JSON.parse(JSON.parse(exportSave(legacy[0]!)).body as string)).toEqual(legacy[0]);
  });

  it('writes and reads a format-2 record per campaign and refreshes the meta', async () => {
    const meta = await newCampaignMeta();
    expect(meta).toMatchObject({
      name: 'Ilsa',
      avatar: 'avatar_b',
      deathMode: 'classic',
      difficulty: 'hard',
      act: 1,
      progress: 0,
      playtimeMs: 0,
    });
    const rec = await writeSave(meta.id, 'auto', format2.payload, opts('2026-10-23T11:00:00.000Z', 1500));
    expect(rec).toMatchObject({
      format: 2,
      campaignId: meta.id,
      slot: 'auto',
      contentVersion: 'cv1',
      createdAt: '2026-10-23T11:00:00.000Z',
    });
    expect(typeof rec.appVersion).toBe('string');
    expect(await readSave(meta.id, 'auto')).toEqual(rec);
    await writeSave(
      meta.id,
      '1',
      { campaign: { ...format2.payload.campaign, completed: ['prologue'] }, screen: 'camp' },
      opts('2026-10-23T12:00:00.000Z', 500),
    );
    const [m] = await listCampaigns();
    expect(m).toMatchObject({
      id: meta.id,
      progress: 1,
      playtimeMs: 2000,
      updatedAt: '2026-10-23T12:00:00.000Z',
      createdAt: meta.createdAt,
    });
    expect((await listSaves(meta.id)).map((r) => r.slot).sort()).toEqual(['1', 'auto']);
  });

  it('refuses saves for an unknown campaign', async () => {
    await expect(writeSave('nope', 'auto', format2.payload, opts('2026-10-23T11:00:00.000Z'))).rejects.toThrow(
      'campaign_missing',
    );
  });

  it('allows at most three campaigns; deleting one frees a place and removes only its saves', async () => {
    const metas = [];
    for (let i = 0; i < MAX_CAMPAIGNS; i++)
      metas.push(await newCampaignMeta(format2.payload.campaign, `2026-10-23T1${i}:00:00.000Z`));
    await expect(newCampaignMeta()).rejects.toBeInstanceOf(CampaignLimitError);
    // re-registering an existing id (import overwrite) is not a fourth campaign
    await expect(
      createCampaign({
        campaign: format2.payload.campaign,
        now: '2026-10-23T20:00:00.000Z',
        contentVersion: 'cv2',
        id: metas[0]!.id,
      }),
    ).resolves.toMatchObject({ id: metas[0]!.id, createdAt: metas[0]!.createdAt });
    expect((await listCampaigns())[0]!.id).toBe(metas[0]!.id); // most recent first
    for (const m of metas) await writeSave(m.id, 'auto', format2.payload, opts('2026-10-23T21:00:00.000Z'));
    await deleteCampaign(metas[1]!.id);
    expect((await listCampaigns()).map((m) => m.id).sort()).toEqual([metas[0]!.id, metas[2]!.id].sort());
    expect(await readSave(metas[1]!.id, 'auto')).toBeUndefined();
    expect(await readSave(metas[2]!.id, 'auto')).toBeDefined();
    await expect(newCampaignMeta()).resolves.toBeDefined();
  });

  it('exports and imports format 2 and rejects PoC saves and tampered files', () => {
    expect(importSave(exportSave(format2))).toEqual(format2);
    expect(() => importSave(exportSave(format1))).toThrow('legacy');
    const tampered = JSON.parse(exportSave(format2)) as { body: string };
    tampered.body = tampered.body.replace('"Ilsa"', '"Eve"');
    expect(() => importSave(JSON.stringify(tampered))).toThrow('checksum');
    expect(() => importSave('{"format":"other"}')).toThrow('format');
  });

  it('the format-2 fixture replays its battle deterministically up to turnStartIndex', () => {
    const { data } = loadContentFromDisk();
    const b = format2.payload.battle!;
    expect(b.turnStartIndex).toBeGreaterThan(0);
    expect(b.turnStartIndex).toBeLessThan(b.commands.length);
    expect(b.commands[b.turnStartIndex - 1]!.type).toBe('endPhase');
    const replay = (from: typeof b, n: number) =>
      from.commands.slice(0, n).reduce((s, cmd) => applyCommand(data, s, cmd).state, from.start);
    const startBefore = structuredClone(b.start);
    const live = replay(b, b.commands.length);
    expect(b.start).toEqual(startBefore); // replay never mutates the saved start
    // a save that went through export/import replays to exactly the same state
    const loaded = importSave(exportSave(format2)).payload.battle!;
    expect(replay(loaded, loaded.commands.length)).toEqual(live);
    expect(replay(b, b.turnStartIndex).turn).toBeGreaterThan(b.start.turn);
  });
});

describe('auto-saver', () => {
  it('coalesces scheduled writes to the latest snapshot and never runs two at once', async () => {
    const queue: Array<() => void> = [];
    const saver = createAutoSaver({ defer: (fn) => queue.push(fn) });
    const written: number[] = [];
    let active = 0;
    const write = (n: number) => async () => {
      active++;
      expect(active).toBe(1);
      await Promise.resolve();
      written.push(n);
      active--;
    };
    saver.schedule(write(1));
    saver.schedule(write(2));
    saver.schedule(write(3));
    expect(written).toEqual([]); // nothing blocks the caller
    expect(queue).toHaveLength(1);
    queue.shift()!();
    await saver.flush();
    expect(written).toEqual([3]);
    saver.schedule(write(4));
    await saver.flush(); // visibilitychange → hidden: written at once
    expect(written).toEqual([3, 4]);
    queue.shift()!(); // the deferred run finds nothing left
    await saver.flush();
    expect(written).toEqual([3, 4]);
  });

  it('reports failed writes and keeps going', async () => {
    const errors: unknown[] = [];
    const saver = createAutoSaver({ defer: () => undefined, onError: (e) => errors.push(e) });
    saver.schedule(() => Promise.reject(new Error('quota')));
    await saver.flush();
    let ok = false;
    saver.schedule(async () => void (ok = true));
    await saver.flush();
    expect(errors).toHaveLength(1);
    expect(ok).toBe(true);
  });
});

describe('play clock', () => {
  const setup = () => {
    let t = 0;
    let vis = true;
    const clock = createPlayClock(
      () => t,
      () => vis,
    );
    return {
      clock,
      tick: (ms: number) => (t += ms),
      setVisible: (v: boolean) => (vis = v),
    };
  };

  it('counts visible time between saves', () => {
    const { clock, tick } = setup();
    tick(1000);
    expect(clock.take()).toBe(1000);
    tick(250);
    expect(clock.take()).toBe(250);
  });

  it('keeps the visible time before going to the background for the flush write', () => {
    const { clock, tick, setVisible } = setup();
    tick(5000);
    setVisible(false);
    clock.hide();
    clock.hide(); // a second hidden event adds nothing
    tick(60_000);
    expect(clock.take()).toBe(5000);
    tick(60_000);
    expect(clock.take()).toBe(0); // background time never counts
    setVisible(true);
    clock.show();
    tick(700);
    expect(clock.take()).toBe(700);
  });

  it('drops banked time when another campaign becomes active', () => {
    const { clock, tick, setVisible } = setup();
    tick(3000);
    setVisible(false);
    clock.hide();
    setVisible(true);
    clock.show();
    clock.reset();
    tick(100);
    expect(clock.take()).toBe(100);
  });
});
