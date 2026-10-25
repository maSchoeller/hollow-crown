/** Review fixes of Epic 3: plan for late lieutenants (R1), seen only (R2), material by act (R5), content rules (R8, R9), consequence card (R33). */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import { validateLieutenants } from '../../src/content/validateLieutenants';
import { consequenceView } from '../../src/ui/ConsequenceCard';
import { addTexts, t } from '../../src/i18n';
import { handleRequest } from '../../src/worker/handle';
import {
  applyCommand,
  autoplay,
  beginBattle,
  createBattle,
  finishBattle,
  knockOut,
  lieutenantLevel,
  newCampaign,
  noteLieutenantSight,
  replayBattle,
  runReinforcements,
  startBattle,
  wantedView,
  type BattleState,
  type CampaignState,
  type GameData,
  type GameEvent,
  type MapUnitDef,
} from '../../src/core';
import type { Locales } from '../../src/content/load';

let data: GameData;
let locales: Locales;
const restore: Array<() => void> = [];
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const fresh = (): CampaignState => newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
  expect(validateContent(data, locales)).toEqual([]);
});
afterEach(() => {
  while (restore.length) restore.pop()!();
});

/** m1_8 is no node of the campaign yet: the first node plays its map for the test. */
const M18 = () => {
  const n = data.campaign.nodes[0]!;
  if (n.map !== 'm1_8_paktwacht_halten') {
    const was = n.map;
    n.map = 'm1_8_paktwacht_halten';
    restore.push(() => (n.map = was));
  }
  return n;
};
const withGrudge = (): CampaignState => {
  const c = fresh();
  c.lieutenants = { ulvric: { met: true, encounters: 2, grudge: 2, routs: 2, target: 'kael', signatureDropped: false } };
  return c;
};
const ids = (c: CampaignState) => c.roster.map((r) => r.id);
const wave2 = (s: BattleState): GameEvent[] => {
  const events: GameEvent[] = [];
  s.turn = 4;
  s.phase = 'enemy';
  runReinforcements(data, s, events);
  return events;
};

describe('lieutenants of a reinforcement wave (R1)', () => {
  it('are built like the ones at the start: level, grudge, target, grudge skills', () => {
    const c = withGrudge();
    const s = createBattle(data, c, M18().id, ids(c));
    expect(s.units.find((u) => u.lieutenant === 'ulvric')).toBeUndefined(); // not on the board yet
    expect(s.lieutenantPlan!.ulvric).toMatchObject({ grudge: 2, target: 'kael', skills: ['wolf_run', 'pack'] });
    wave2(s);
    const u = s.units.find((x) => x.lieutenant === 'ulvric')!;
    expect(u.level).toBe(lieutenantLevel(data, c, 2));
    expect(u.grudge).toBe(2);
    expect(u.grudgeTarget).toBe('kael');
    expect(u.mastered).toEqual(expect.arrayContaining(['wolf_run', 'pack']));
    expect(u.loadout).toEqual(expect.arrayContaining(['wolf_run', 'pack']));
    expect(u.mastered).not.toContain('breakthrough');
  });

  it('match the line-up build exactly: the same lieutenant on the map start and as a late spawn', () => {
    const c = withGrudge();
    const map = data.maps[M18().map]!;
    const copy: MapUnitDef = clone(map.reinforcements.flatMap((r) => r.units).find((u) => u.lieutenant === 'ulvric')!);
    const early = createBattle(data, c, M18().id, ids(c));
    // the same unit as a line-up unit of the map
    map.units.push(copy);
    restore.push(() => map.units.pop());
    const sStart = createBattle(data, c, M18().id, ids(c));
    const a = sStart.units.find((u) => u.lieutenant === 'ulvric')!;
    wave2(early);
    const b = early.units.find((u) => u.lieutenant === 'ulvric')!;
    const pick = (u: typeof a) => ({ level: u.level, stats: u.stats, grudge: u.grudge, target: u.grudgeTarget, mastered: u.mastered, loadout: u.loadout, items: [...Object.values(u.equip), ...u.bag].map((i) => i!.def) });
    expect(pick(b)).toEqual(pick(a));
  });

  it('a lieutenant who joined the company does not spawn (no second grosk)', () => {
    const c = fresh();
    c.flags['joined_grosk'] = true;
    const s = createBattle(data, c, M18().id, ids(c));
    expect(s.lieutenantPlan!.grosk).toBeUndefined();
    wave2(s);
    expect(s.units.some((u) => u.lieutenant === 'grosk')).toBe(false);
    expect(s.units.some((u) => u.lieutenant === 'ulvric')).toBe(true);
    const other = createBattle(data, fresh(), M18().id, ids(fresh()));
    wave2(other);
    expect(other.units.some((u) => u.lieutenant === 'grosk')).toBe(true);
  });

  it('an older state without a plan still builds the unit as the map says', () => {
    const c = withGrudge();
    const s = createBattle(data, c, M18().id, ids(c));
    delete s.lieutenantPlan;
    wave2(s);
    const u = s.units.find((x) => x.lieutenant === 'ulvric')!;
    expect(u.level).toBe(9);
    expect(u.grudge).toBeUndefined();
  });

  it('the plan is plain JSON and replays give the same state, also through the worker protocol', () => {
    const c = withGrudge();
    const start = startBattle(data, createBattle(data, c, M18().id, ids(c))).state;
    expect(structuredClone(start)).toEqual(start);
    const played = autoplay(data, start, 400);
    expect(replayBattle(data, start, played.log)).toEqual(played.state);
    expect(played.state.units.some((u) => u.lieutenant === 'ulvric')).toBe(true);
    // the enemy phases through the worker
    let s = start;
    let id = 1;
    for (const cmd of played.log) {
      if (cmd.type === 'endPhase') {
        const res = structuredClone(handleRequest(data, structuredClone({ id: id++, kind: 'apply' as const, packs: [], state: s, command: cmd })));
        if (!res.ok) throw new Error(res.error);
        s = res.state;
      } else s = applyCommand(data, s, cmd).state;
    }
    expect(s).toEqual(played.state);
  });
});

describe('met only when seen or fled (R2)', () => {
  const setup = (fog: boolean) => {
    const c = fresh();
    const s = beginBattle(data, c, 'prologue', ids(c)).state;
    const map = data.maps[s.mapId]!;
    const was = map.fog;
    map.fog = fog;
    restore.push(() => (map.fog = was));
    const foe = s.units.find((u) => u.team === 'enemy')!;
    foe.lieutenant = 'hask';
    return { c, s, foe };
  };

  it('without fog the company sees him from the first moment', () => {
    const { c, s } = setup(false);
    delete s.ltSeen;
    noteLieutenantSight(data, s);
    expect(s.ltSeen).toEqual(['hask']);
    s.outcome = 'victory';
    expect(finishBattle(data, c, s).campaign.lieutenants!.hask).toMatchObject({ met: true, encounters: 1 });
  });

  it('under fog a lieutenant never seen is not met; once seen he is', () => {
    const { c, s, foe } = setup(true);
    const mine = s.units.filter((u) => u.team === 'player' && u.pos);
    foe.pos = [s.width - 1, s.height - 1];
    mine.forEach((u, i) => (u.pos = [i % 2, Math.floor(i / 2)]));
    s.ltSeen = [];
    noteLieutenantSight(data, s);
    expect(s.ltSeen).toEqual([]);
    const lost = clone(s);
    lost.outcome = 'victory';
    expect(finishBattle(data, c, lost).campaign.lieutenants?.hask).toBeUndefined();
    // a unit of the company walks up to him
    mine[0]!.pos = [foe.pos[0] - 1, foe.pos[1]];
    noteLieutenantSight(data, s);
    expect(s.ltSeen).toEqual(['hask']);
    s.outcome = 'victory';
    expect(finishBattle(data, c, s).campaign.lieutenants!.hask).toMatchObject({ met: true, encounters: 1, routs: 0 });
  });

  it('a lieutenant driven off counts as met even when the list is empty', () => {
    const { c, s, foe } = setup(true);
    s.ltSeen = [];
    knockOut(data, s, foe, [], s.units.find((u) => u.team === 'player')!.uid);
    expect(foe.gone).toBe('fled');
    s.outcome = 'victory';
    expect(finishBattle(data, c, s).campaign.lieutenants!.hask).toMatchObject({ met: true, routs: 1, grudge: 1 });
  });

  it('is kept up to date by the commands (a reinforcement included), so a replay gives the same list', () => {
    const c = withGrudge();
    const start = startBattle(data, createBattle(data, c, M18().id, ids(c))).state;
    const played = autoplay(data, start, 400);
    expect(played.state.ltSeen).toEqual(expect.arrayContaining(['hask', 'ulvric']));
    expect(replayBattle(data, start, played.log).ltSeen).toEqual(played.state.ltSeen);
  });
});

describe('bounty material by the act of the lieutenant (R5)', () => {
  it('wantedView and the payout use the act of the lieutenant, not of the campaign', () => {
    const saved = data.campaign.act;
    data.campaign.act = 2;
    restore.push(() => (data.campaign.act = saved));
    expect(wantedView(data, fresh(), 'hask')!.material).toMatchObject({ id: 'iron_ore' });
    const c = fresh();
    const s = beginBattle(data, c, 'prologue', ids(c)).state;
    const foe = s.units.find((u) => u.team === 'enemy')!;
    foe.lieutenant = 'hask';
    knockOut(data, s, foe, [], s.units.find((u) => u.team === 'player')!.uid);
    s.outcome = 'victory';
    const r = finishBattle(data, c, s);
    expect(r.result.bounty![0]!.material?.id).toBe('iron_ore');
  });
});

describe('content rules (R8, R9)', () => {
  const run = (d: GameData): string[] => {
    const out: string[] = [];
    validateLieutenants(d, locales, (f, m) => out.push(`${f}: ${m}`));
    return out;
  };

  it('the real content is clean', () => expect(run(data)).toEqual([]));

  it('rejects the same lieutenant twice on a map and difficulty (line-up + wave)', () => {
    const map = data.maps[M18().map]!;
    const dup = clone(map.units.find((u) => u.lieutenant === 'hask')!);
    map.reinforcements[0]!.units.push(dup);
    restore.push(() => map.reinforcements[0]!.units.pop());
    expect(run(data).some((e) => e.includes('hask') && e.includes('at most once'))).toBe(true);
  });

  it('allows the same lieutenant on different difficulties', () => {
    const map = data.maps[M18().map]!;
    const base = map.units.find((u) => u.lieutenant === 'hask')!;
    const was = base.difficulty;
    base.difficulty = ['easy'];
    const extra = clone(base);
    extra.difficulty = ['normal', 'hard'];
    map.units.push(extra);
    restore.push(() => {
      map.units.pop();
      base.difficulty = was;
    });
    expect(run(data).filter((e) => e.includes('at most once'))).toEqual([]);
  });

  it('reports a mismatch between the grudge maximum and the lines or skills', () => {
    const d = { ...data, balance: { ...data.balance, lieutenant: { ...data.balance.lieutenant, grudge: { max: 4 } } } } as GameData;
    const errs = run(d);
    expect(errs.some((e) => e.includes('grudge_<n> lines'))).toBe(true);
    expect(errs.some((e) => e.includes('hask') && e.includes('grudge skills'))).toBe(true);
  });
});

describe('consequence card of a grudge effect (R33)', () => {
  it('names the lieutenant, shows the signed change and says which way he comes back', () => {
    addTexts('de', locales.de ?? {});
    const head = () => null;
    const up = consequenceView(data, { kind: 'grudge', lt: 'hask', delta: 1 }, head);
    const down = consequenceView(data, { kind: 'grudge', lt: 'hask', delta: -1 }, head);
    expect(up.title).toContain(t('unit.hask.name'));
    expect(up.title).not.toMatch(/Leutnants/);
    expect(up.desc).toBe(`${t('unit.hask.name')} kommt stärker zurück.`);
    expect(down.desc).toBe(`${t('unit.hask.name')} kommt schwächer zurück.`);
    expect(JSON.stringify(up.amount)).toContain('+1');
    expect(JSON.stringify(down.amount)).toContain('−1');
  });
});
