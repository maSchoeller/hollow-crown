/** Grudge and grudge target of the lieutenants (story 3.3): state, after the mission, effect and condition, AI, opening lines. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import { ltBarks } from '../../src/app/battle/ltLines';
import { addTexts, t } from '../../src/i18n';
import {
  applyCampaign,
  applyEffects,
  attackPlans,
  beginBattle,
  conditionContext,
  createBattle,
  evalCondition,
  finishBattle,
  isVisibleToPlayer,
  ltLinesDue,
  ltOpeningLine,
  newCampaign,
  normalizeCampaign,
  validateCampaign,
  type BattleState,
  type BattleUnit,
  type CampaignEvent,
  type CampaignState,
  type GameData,
} from '../../src/core';

let data: GameData;
let locales: ReturnType<typeof loadContentFromDisk>['locales'];
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const fresh = (): CampaignState => newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});

/** A won prologue with an enemy lieutenant on the map; `fledBy` = he was driven off by that roster unit. */
function won(c: CampaignState, opts: { fledBy?: string; ltId?: string } = {}): BattleState {
  const s = beginBattle(data, c, 'prologue', c.roster.map((r) => r.id)).state;
  const lt = clone(s.units.find((u) => u.team === 'enemy')!);
  lt.uid = 'lt1';
  lt.lieutenant = opts.ltId ?? 'hask';
  if (opts.fledBy) {
    lt.gone = 'fled';
    lt.fledBy = s.units.find((u) => u.id === opts.fledBy)!.uid;
    lt.pos = null;
  }
  s.units.push(lt);
  s.outcome = 'victory';
  return s;
}

describe('after the mission (AC 3)', () => {
  it('counts a meeting and sets met, without a grudge for a lieutenant who stayed', () => {
    const lt = finishBattle(data, fresh(), won(fresh())).campaign.lieutenants!.hask!;
    expect(lt).toEqual({ met: true, encounters: 1, grudge: 0, routs: 0, signatureDropped: false });
  });

  it('a rout raises the grudge and sets the driver as target; again and again up to 3; a new driver changes the target', () => {
    let c = fresh();
    for (const [by, grudge, target] of [['kael', 1, 'kael'], ['kael', 2, 'kael'], ['brenna', 3, 'brenna'], ['kael', 3, 'kael']] as const) {
      c = finishBattle(data, c, won(c, { fledBy: by })).campaign;
      expect(c.lieutenants!.hask).toMatchObject({ grudge, target, met: true });
    }
    expect(c.lieutenants!.hask).toMatchObject({ encounters: 4, routs: 4 });
  });

  it('an allied NPC as driver leaves the target as it was', () => {
    let c = finishBattle(data, fresh(), won(fresh(), { fledBy: 'kael' })).campaign;
    const s = won(c, { fledBy: 'kael' });
    s.units.find((u) => u.uid === 'lt1')!.fledBy = s.units.find((u) => u.id === 'brenna')!.uid;
    s.units.find((u) => u.id === 'brenna')!.team = 'other';
    c = finishBattle(data, c, s).campaign;
    expect(c.lieutenants!.hask).toMatchObject({ grudge: 2, routs: 2, target: 'kael' });
  });

  it('a defeat changes nothing', () => {
    const c = fresh();
    const s = won(c, { fledBy: 'kael' });
    s.outcome = 'defeat';
    expect(finishBattle(data, c, s).campaign).toBe(c);
  });

  it('ignores a lieutenant the content does not know, and missions without one stay as they were', () => {
    const c = fresh();
    expect(finishBattle(data, c, won(c, { ltId: 'nobody' })).campaign.lieutenants).toBeUndefined();
    const s = beginBattle(data, c, 'prologue', c.roster.map((r) => r.id)).state;
    s.outcome = 'victory';
    expect(finishBattle(data, c, s).campaign.lieutenants).toBeUndefined();
  });
});

describe('effect grudge and condition met (AC 4)', () => {
  it('changes the grudge inside 0-3 and reports it', () => {
    const run = (delta: number, from: CampaignState) => applyCampaign(data, from, { type: 'effects', effects: [{ grudge: { lt: 'hask', delta } }] });
    const up = run(5, fresh());
    expect(up.campaign.lieutenants!.hask!.grudge).toBe(3);
    expect(up.events).toContainEqual({ t: 'grudgeChanged', lt: 'hask', grudge: 3 });
    const down = run(-1, up.campaign);
    expect(down.campaign.lieutenants!.hask!.grudge).toBe(2);
    const floor = run(-9, down.campaign);
    expect(floor.campaign.lieutenants!.hask!.grudge).toBe(0);
    expect(run(-1, floor.campaign).events.filter((e) => e.t === 'grudgeChanged')).toEqual([]);
    expect(run(1, fresh()).campaign.lieutenants!.hask).toMatchObject({ met: false, grudge: 1 });
  });

  it('refuses an unknown lieutenant', () => {
    expect(validateCampaign(data, fresh(), { type: 'effects', effects: [{ grudge: { lt: 'nobody', delta: 1 } }] })).toBe('unknown_unit');
    const events: CampaignEvent[] = [];
    applyEffects(data, fresh(), [{ grudge: { lt: 'hask', delta: 1 } }], events);
    expect(events).toHaveLength(1);
  });

  it('met reads the campaign', () => {
    const c = fresh();
    expect(evalCondition(conditionContext(data, c), { met: 'hask' })).toBe(false);
    expect(evalCondition(conditionContext(data, null), { met: 'hask' })).toBe(false);
    c.lieutenants = { hask: { met: true, encounters: 1, grudge: 0, routs: 0, signatureDropped: false } };
    expect(evalCondition(conditionContext(data, c), { met: 'hask' })).toBe(true);
  });

  it('content:check knows both keys and checks the lieutenant', () => {
    const issues = (lt: string, effect: boolean) => {
      const d = clone(data);
      const l = clone(locales);
      for (const x of Object.values(d.lieutenants)) for (const lang of ['de', 'en']) l[lang]![x.titleKey] ??= 'Title';
      if (effect) d.campaign.nodes[0]!.requires = [{ met: lt }];
      else d.rooms.smith!.requires = [{ met: lt }];
      return validateContent(d, l).map((i) => i.message);
    };
    expect(issues('hask', false).filter((m) => m.includes('lieutenant'))).toEqual([]);
    expect(issues('nobody', false)).toContainEqual(expect.stringContaining('unknown lieutenant nobody'));
  });
});

describe('save and set-up (AC 1, 6)', () => {
  it('fills the new fields of an older save that holds only met', () => {
    const c = fresh();
    c.lieutenants = { hask: { met: true } as never };
    expect(normalizeCampaign(data, c).lieutenants!.hask).toEqual({ met: true, encounters: 0, grudge: 0, routs: 0, signatureDropped: false });
    expect(normalizeCampaign(data, fresh()).lieutenants).toBeUndefined();
  });

  it('createBattle gives each lieutenant on the map his grudge and target from the campaign', () => {
    const d = clone(data);
    d.maps.prologue_caravan!.units.push({ id: 'ltx', team: 'enemy', class: 'brigand', lieutenant: 'hask', level: 3, at: [1, 1], items: [] });
    d.maps.prologue_caravan!.units.push({ id: 'lty', team: 'enemy', class: 'marksman', lieutenant: 'morra', level: 3, at: [2, 1], items: [] });
    const c = fresh();
    c.lieutenants = { hask: { met: true, encounters: 2, grudge: 2, target: 'brenna', routs: 2, signatureDropped: false } };
    const s = createBattle(d, c, 'prologue', c.roster.map((r) => r.id));
    expect(s.units.find((u) => u.uid === 'ltx')).toMatchObject({ grudge: 2, grudgeTarget: 'brenna' });
    expect(s.units.find((u) => u.uid === 'lty')!.grudge).toBeUndefined();
  });
});

describe('AI (AC 5)', () => {
  it('adds balance.ai.grudgeTargetBonus to the grudge target, only for a lieutenant with a target', () => {
    expect(data.balance.ai.grudgeTargetBonus).toBe(20);
    const c = fresh();
    const s = beginBattle(data, c, 'prologue', c.roster.map((r) => r.id)).state;
    const foe = s.units.find((u) => u.team === 'enemy')!;
    const target = s.units.find((u) => u.team === 'player' && u.pos)!;
    foe.pos = [target.pos![0], target.pos![1] + 1];
    const score = () => attackPlans(data, s, foe, [foe.pos!], target.uid).find((p) => p.action.kind === 'attack')!.score;
    const base = score();
    foe.grudgeTarget = target.id;
    expect(score()).toBe(base); // not a lieutenant
    foe.lieutenant = 'hask';
    expect(score()).toBe(base); // grudge 0: the target stays stored but gives no bonus
    foe.grudge = 1;
    expect(score()).toBeCloseTo(base + 20);
    foe.grudgeTarget = 'someone_else';
    expect(score()).toBe(base);
  });
});

describe('opening lines (AC 7)', () => {
  const lt = (over: Partial<BattleUnit> = {}): BattleUnit => ({ uid: 'u', id: 'hask', team: 'enemy', pos: [1, 1], lieutenant: 'hask', ...over }) as BattleUnit;
  const known = { hask: { met: true, encounters: 1, grudge: 0, routs: 0, signatureDropped: false } };
  const camp = (lieutenants?: CampaignState['lieutenants']) =>
    ({ lieutenants, roster: [{ id: 'kael' }], fallen: [{ id: 'fenn', nameKey: 'unit.fenn.name' }] }) as unknown as CampaignState;

  it('not met: first; grudge and a living target: grudge_<n>; fallen target: mock; met without grudge: none', () => {
    expect(ltOpeningLine(camp(), lt())).toEqual({ line: 'first' });
    expect(ltOpeningLine(camp(known), lt({ grudge: 2, grudgeTarget: 'kael' }))).toEqual({ line: 'grudge_2', target: 'kael' });
    expect(ltOpeningLine(camp(known), lt({ grudge: 3, grudgeTarget: 'kael' }))!.line).toBe('grudge_3');
    expect(ltOpeningLine(camp(known), lt({ grudge: 1, grudgeTarget: 'fenn' }))).toEqual({ line: 'mock', target: 'fenn' });
    expect(ltOpeningLine(camp(known), lt())).toBeNull();
    expect(ltOpeningLine(camp(known), lt({ grudge: 0, grudgeTarget: 'kael' }))).toBeNull();
  });

  it('grudge without target, a target who left, and a plain unit give no line', () => {
    expect(ltOpeningLine(camp(known), lt({ grudge: 2 }))).toBeNull();
    expect(ltOpeningLine(camp(known), lt({ grudge: 2, grudgeTarget: 'gone_away' }))).toBeNull();
    const left = { ...camp(known), left: ['brenna'] } as CampaignState;
    expect(ltOpeningLine(left, lt({ grudge: 2, grudgeTarget: 'brenna' }))).toBeNull();
    expect(ltOpeningLine(camp(), lt({ lieutenant: undefined }))).toBeNull();
  });

  it('a lieutenant who is down, gone or off the board does not speak; everything on the board is seen without fog', () => {
    const s = { units: [lt({ uid: 'a' }), lt({ uid: 'b', downed: true }), lt({ uid: 'c', gone: 'fled' }), lt({ uid: 'd', pos: null }), lt({ uid: 'e', team: 'player' })] } as BattleState;
    expect(isVisibleToPlayer(data, s, s.units[0]!)).toBe(true);
    expect(ltLinesDue(data, camp(), s, new Set()).map((l) => l.unit)).toEqual(['a']);
    expect(ltLinesDue(data, camp(), s, new Set(['a']))).toEqual([]);
  });

  it('ltBarks marks speakers, names the target, and leaves the line out in skip mode', () => {
    const c = fresh();
    c.lieutenants = { hask: { met: true, encounters: 1, grudge: 2, target: 'brenna', routs: 1, signatureDropped: false } };
    const s = { units: [lt({ uid: 'a', grudge: 2, grudgeTarget: 'brenna' })] } as BattleState;
    const spoken = new Set<string>();
    const [bark] = ltBarks(data, c, s, spoken, true);
    expect(bark).toMatchObject({ unit: 'a', anchor: 'a', scene: 'scn.lt.hask', line: 'grudge_2' });
    expect(spoken.has('a')).toBe(true);
    expect(ltBarks(data, c, s, spoken, true)).toEqual([]);
    const skipped = new Set<string>();
    expect(ltBarks(data, c, s, skipped, false)).toEqual([]);
    expect(skipped.has('a')).toBe(true);
    expect(ltBarks(data, null, s, new Set(), true)).toEqual([]);
    addTexts('de', locales.de!);
    expect(t('dlg.scn.lt.hask.grudge_2', bark!.params)).toContain(bark!.params!.target);
  });
});
