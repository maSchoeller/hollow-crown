import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyCampaign,
  applyCommand,
  autoplay,
  beginBattle,
  companyLevel,
  createHauntBattle,
  effectiveLevel,
  makeHaunt,
  newCampaign,
  nodeLevel,
  findNode,
  replayCampaign,
  seedRng,
  startBattle,
  stateHash,
  type CampaignCommand,
  type CampaignState,
} from '../../src/core';
import { loadContentFromDisk } from '../../src/content/node';
import { migrate, SAVE_FORMAT, type SaveRecord } from '../../src/persistence/save';
import { journeyRows } from '../../tools/journeyCheck';

const { data } = loadContentFromDisk();
const fresh = (): CampaignState => newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as never);
const run = (c: CampaignState, cmds: CampaignCommand[]): CampaignState => cmds.reduce((x, cmd) => applyCampaign(data, x, cmd).campaign, c);

/** The prologue played by the autoplayer, as the finishMission the app sends. */
function prologue(c: CampaignState): CampaignCommand & { type: 'finishMission' } {
  const start = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  return { type: 'finishMission', start, commands: autoplay(data, start).log };
}

describe('play history (architecture §6.2b)', () => {
  it('a new campaign starts an empty history recorded from the start', () => {
    expect(fresh().history).toEqual({ since: 'start', battles: [], camp: [], turnRestarts: 0 });
  });

  it('a won mission adds a record with levels, gold, EP, losses and the replayable log', () => {
    const c0 = { ...fresh(), gold: 500 };
    const c1 = run(c0, [{ type: 'buy', item: 'iron_sword' }, { type: 'restartTurn', node: 'prologue', keep: 0 }]);
    expect(c1.history!.camp).toEqual([{ cmd: 'buy', arg: 'iron_sword', gold: c1.gold - c0.gold }]);
    const cmd = prologue(c1);
    const r = applyCampaign(data, c1, cmd);
    const c2 = r.campaign;
    const h = c2.history!;
    expect(h.camp).toEqual([]);
    expect(h.turnRestarts).toBe(0);
    expect(h.battles).toHaveLength(1);
    const b = h.battles[0]!;
    let end = cmd.start;
    for (const x of cmd.commands) end = applyCommand(data, end, x).state;
    expect(end.outcome).toBe('victory');
    expect(b).toMatchObject({
      n: 1,
      node: 'prologue',
      map: cmd.start.mapId,
      act: 1,
      attempt: 1,
      outcome: 'victory',
      rounds: end.turn,
      difficulty: 'normal',
      deathMode: 'standard',
      army: Math.round(companyLevel(data, c1) * 100) / 100,
      expected: nodeLevel(data, c1, findNode(data, 'prologue')!),
      goldBefore: c1.gold,
      goldAfter: c2.gold,
      downs: end.stats.downs,
      turnRestarts: 1,
      actions: cmd.commands.length,
      startHash: stateHash(cmd.start),
    });
    expect(b.camp).toEqual(c1.history!.camp);
    expect(b.commands).toEqual(cmd.commands);
    expect(b.start).toEqual(cmd.start);
    const result = r.events.find((e) => e.t === 'missionFinished')!;
    if (result.t !== 'missionFinished') throw new Error('no result');
    expect(b.side).toEqual(result.result.side.filter((s) => s.done).map((s) => s.id));
    expect(b.fallen).toEqual(result.result.fallen.map((f) => f.id));
    const deployed = cmd.start.units.filter((u) => u.team === 'player' && c1.roster.some((x) => x.id === u.id));
    expect(b.units.map((u) => u.id)).toEqual(c1.roster.filter((u) => deployed.some((d) => d.id === u.id)).map((u) => u.id));
    for (const u of b.units) {
      const before = c1.roster.find((x) => x.id === u.id)!;
      const after = c2.roster.find((x) => x.id === u.id);
      expect(u).toMatchObject({ classId: before.classId, level: before.level, eff: effectiveLevel(data, before), levelAfter: after?.level ?? before.level });
      expect(u.ep).toBe(result.result.units.find((x) => x.id === u.id)?.exp ?? 0);
    }
    expect(b.ep).toBe(b.units.reduce((n, u) => n + u.ep, 0));
    // the old records are shared, not copied, and a journal replay builds the same history
    const c3 = run(c2, [{ type: 'markActTitleSeen', act: 1 }]);
    expect(c3.history!.battles[0]).toBe(b);
    expect(replayCampaign(data, c0, [{ type: 'buy', item: 'iron_sword' }, { type: 'restartTurn', node: 'prologue', keep: 0 }, cmd]).history).toEqual(h);
  });

  it('restarts and abandoned missions count as attempts at the same node', () => {
    const c0 = fresh();
    const c1 = run(c0, [
      { type: 'restartMission', node: 'prologue' },
      { type: 'abandonMission', node: 'prologue', commands: [] },
    ]);
    const cmd = prologue(c1);
    const h = applyCampaign(data, c1, cmd).campaign.history!;
    expect(h.battles.map((b) => [b.outcome, b.attempt])).toEqual([
      ['restarted', 1],
      ['abandoned', 2],
      ['victory', 3],
    ]);
    expect(h.battles[0]).toMatchObject({ rounds: null, startHash: null, units: [], downs: null });
    expect(h.battles[0]!.start).toBeUndefined();
  });

  it('a haunt adds a record with its id and expected level', () => {
    const c = fresh();
    c.completed = ['prologue', 'm1_1', 'm1_2'];
    c.lieutenants = { hask: { met: true, encounters: 1, grudge: 0, routs: 1, signatureDropped: false } };
    const anchor = data.maps.m1_2_erlbach!.haunts!.find((a) => a.variant === 'rout')!;
    c.haunts = [makeHaunt(data, c, data.maps.m1_2_erlbach!, anchor, data.lieutenants.hask!, 'h1_0', 1, seedRng(3))!];
    const start = startBattle(data, createHauntBattle(data, c, 'h1_0', c.roster.map((u) => u.id))).state;
    const done = autoplay(data, start);
    const h = applyCampaign(data, c, { type: 'finishMission', start, commands: done.log }).campaign.history!;
    expect(h.battles).toHaveLength(1);
    expect(h.battles[0]).toMatchObject({ node: start.nodeId, haunt: 'h1_0', map: start.mapId, outcome: done.state.outcome, expected: start.hauntLevel ?? null, rounds: done.state.turn });
  });

  it('journey rows sum up a record (tools/journey.ts)', () => {
    const c1 = run({ ...fresh(), gold: 500 }, [{ type: 'buy', item: 'iron_sword' }]);
    const c2 = applyCampaign(data, c1, prologue(c1)).campaign;
    const [row] = journeyRows(c2.history!);
    expect(row).toMatchObject({ n: 1, node: 'prologue', result: 'victory', campGold: c1.gold - 500, gold: c2.gold - c1.gold });
  });
});

describe('save migration 3 → 4 (play history)', () => {
  const dir = join(process.cwd(), 'tests/fixtures/saves');

  it('gives a format 3 save an empty history marked migrated, and keeps the rest', () => {
    const rec = JSON.parse(readFileSync(join(dir, 'format3-act1-finale-done.json'), 'utf8')) as SaveRecord;
    expect(rec.format).toBe(3);
    expect(rec.payload.campaign.history).toBeUndefined();
    const out = migrate(rec);
    expect(out.format).toBe(SAVE_FORMAT);
    expect(out.payload.campaign.history).toEqual({ since: 'migrated', battles: [], camp: [], turnRestarts: 0 });
    const { history: _h, ...rest } = out.payload.campaign;
    expect(rest).toEqual(rec.payload.campaign);
    expect(migrate(out)).toEqual(out);
  });
});
