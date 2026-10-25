import type { GameData, Reward, SideObjectiveDef, Stats } from '../defs';
import type { GameEvent } from '../events';
import { newItem, recordFromChar, autoEquip, genericStats } from '../battle/create';
import { sideObjectiveDone } from '../battle/objectives';
import { rollAffixes } from '../loot';
import { nextInt, pick, seedRng } from '../rng';
import { allItems, itemDef } from '../rules/items';
import { grantSp, levelCap } from '../rules/progression';
import type { AvatarSettings, BattleSettings, BattleState, BattleUnit, CampaignState, ItemInstance, UnitRecord } from '../state';
import { clone } from '../util';
import { conditionContext, evalConditions } from './conditions';
import { availableNodes, noteRoles } from './graph';
import { availableSupportTalks } from './camp';
import { applyLieutenantOutcome, lieutenantState, payBounties } from './lieutenants';

export const SAVE_VERSION = 1;

export function newCampaign(data: GameData, seed: number, settings: BattleSettings, avatar: AvatarSettings): CampaignState {
  const c: CampaignState = {
    version: SAVE_VERSION,
    seed,
    rng: seedRng(seed ^ 0x5eed),
    settings: clone(settings),
    avatar: clone(avatar),
    roster: [],
    fallen: [],
    convoy: [],
    gold: data.campaign.startGold,
    materials: {},
    flags: {},
    left: [],
    stance: { warm: 0, sober: 0, defiant: 0 },
    chronicle: [],
    choices: {},
    decisions: [],
    scenesSeen: [],
    completed: [],
    quests: [],
    rolesSeen: [],
    supports: {},
    nextUid: 1,
    offers: [],
    home: { kind: data.campaign.home, rooms: {} },
    tavern: [],
    day: { last: null, pending: [] },
  };
  for (const def of Object.values(data.chars)) {
    if (def.joins !== 'prologue') continue;
    c.roster.push(recordFromChar(data, def, c, avatar));
  }
  noteRoles(data, c);
  for (const ref of data.campaign.startConvoy) c.convoy.push(newItem(c, ref, data));
  for (const key of Object.keys(data.supports)) c.supports[key] = { points: 0, rank: null };
  return c;
}

/** Fills fields a saved campaign may lack (architecture §8.7: new persisted fields get a default on load). */
export function normalizeCampaign(data: GameData, c: CampaignState): CampaignState {
  const old = c as unknown as {
    flags: unknown;
    left?: string[];
    stance?: CampaignState['stance'];
    chronicle?: string[];
    scenesSeen?: string[];
    quests?: string[];
    rolesSeen?: string[];
    available?: string[];
    choices?: Record<string, string>;
    decisions?: CampaignState['decisions'];
  };
  // story 4.3: the graph replaces the stored list of available nodes
  const { available: _available, ...rest } = old as unknown as CampaignState & { available?: string[] };
  const out: CampaignState = {
    ...rest,
    // format 2 as the PoC wrote it kept a list of flag names
    flags: Array.isArray(old.flags) ? Object.fromEntries((old.flags as string[]).map((f) => [f, true as const])) : c.flags,
    left: old.left ?? [],
    stance: old.stance ?? { warm: 0, sober: 0, defiant: 0 },
    chronicle: old.chronicle ?? [],
    scenesSeen: old.scenesSeen ?? [],
    home: c.home ?? { kind: 'camp', rooms: {} },
    tavern: c.tavern ?? [],
    // pairs of content added since the save (a later act) start empty
    supports: { ...Object.fromEntries(Object.keys(data.supports).map((k) => [k, { points: 0, rank: null }])), ...c.supports },
    quests: old.quests ?? [],
    choices: old.choices ?? {},
    decisions: old.decisions ?? [],
    rolesSeen: [...(old.rolesSeen ?? [])],
    day: c.day ?? { last: null, pending: [] },
    // story 3.3: lieutenants of older saves hold only `met`
    ...(c.lieutenants ? { lieutenants: Object.fromEntries(Object.entries(c.lieutenants).map(([id]) => [id, lieutenantState(c, id)])) } : {}),
  };
  noteRoles(data, out);
  return out;
}

/** Old class id → its replacement, from `legacyIds` in classes.yaml. */
function legacyClassIds(data: GameData): Map<string, string> {
  const out = new Map<string, string>();
  for (const cls of Object.values(data.classes)) for (const old of cls.legacyIds ?? []) out.set(old, cls.id);
  return out;
}

function renameClasses<T extends { classId: string }>(units: T[], map: Map<string, string>): T[] {
  return units.map((u) => (map.has(u.classId) ? { ...u, classId: map.get(u.classId)! } : u));
}

/** Saves written before story 2.2 name the old weapon classes (`mercenary` …); they map onto the roles that replaced them. */
export function renameLegacyClasses(data: GameData, c: CampaignState): CampaignState {
  const map = legacyClassIds(data);
  return { ...c, roster: renameClasses(c.roster, map), tavern: renameClasses(c.tavern, map) };
}

/**
 * Same for a saved battle's start state. The command log refers to units by id, but the new classes differ in skills and
 * movement (fighter → vanguard, …), so an old log may no longer replay: `restore` (app/state/flow.ts) then reports the
 * rejected command as a fault and the player lands on the fault screen instead of a half-restored battle.
 */
export function renameLegacyBattleClasses(data: GameData, s: BattleState): BattleState {
  return { ...s, units: renameClasses(s.units, legacyClassIds(data)) };
}

export interface UnitResult {
  id: string;
  nameKey: string;
  name?: string;
  levelBefore: number;
  levelAfter: number;
  exp: number;
  /** stands at the act's level cap after the mission (further EP were forfeited) */
  capped?: boolean;
  mastered: string[];
  portrait?: string;
  classId?: string;
}

/** A company member who died in the mission; drives the farewell card (story 6.7). */
export interface FallenResult {
  id: string;
  nameKey: string;
  name?: string;
  portrait?: string;
  classId?: string;
  /** hired in the tavern: short farewell without last line and grief */
  mercenary?: boolean;
  /** surviving support partners who now grieve, with the missions the penalty lasts */
  grief?: Array<{ id: string; missions: number }>;
}

/** Bounty for a lieutenant driven off in a mission, and the grudge it leaves (Epic 3 fills this; empty until then). */
export interface BountyResult {
  id: string;
  nameKey: string;
  name?: string;
  portrait?: string;
  /** paid in gold; not part of `BattleResult.gold` (loot and bounty are shown apart) */
  gold: number;
  /** grudge level after this mission */
  grudge: number;
  /** material of the act paid with it (not part of `BattleResult.materials`) */
  material?: { id: string; count: number };
  /** his signature item, when it fell (already in the convoy; not part of `BattleResult.items`) */
  signature?: ItemInstance;
}

export interface BattleResult {
  outcome: 'victory' | 'defeat';
  nodeId: string;
  turns: number;
  side: Array<{ id: string; type: SideObjectiveDef['type']; done: boolean; reward: Reward; turns?: number }>;
  gold: number;
  materials: Record<string, number>;
  items: ItemInstance[];
  units: UnitResult[];
  fallen: FallenResult[];
  /** lieutenants driven off (bounty + new grudge); empty while there are none */
  bounty: BountyResult[];
  scars: Array<{ id: string; scar: string }>;
  recruited: string[];
  supportsReady: string[];
  /** items handed to company members by the node (campaign.yaml `grants`) */
  granted: Array<{ id: string; item: ItemInstance }>;
}

function refill(data: GameData, items: ItemInstance[]): void {
  for (const i of items) {
    const d = itemDef(data, i);
    if (d.refillAfterMission && d.charges) i.charges = d.charges;
  }
}

function toRecord(u: BattleUnit): UnitRecord {
  const rec: UnitRecord = {
    id: u.id,
    charId: u.charId,
    name: u.name,
    nameKey: u.nameKey,
    classId: u.classId,
    level: u.level,
    exp: u.exp,
    stats: clone(u.stats),
    growth: clone(u.growth),
    gained: clone(u.gained),
    expected: clone(u.expected),
    affinity: u.affinity,
    personalSkill: u.personalSkill,
    flags: [...u.flags],
    equip: clone(u.equip),
    bag: clone(u.bag),
    scars: [...u.scars],
    mastered: [...u.mastered],
    loadout: [...u.loadout],
    sp: clone(u.sp),
    portrait: u.portrait,
    sprite: u.sprite,
    grief: u.grief,
  };
  return rec;
}

/**
 * Applies a finished battle to the campaign (concept/07 §6 Ergebnis). Victory commits everything;
 * a defeat leaves the campaign as it was before the battle.
 */
export function finishBattle(data: GameData, c0: CampaignState, s: BattleState): { campaign: CampaignState; result: BattleResult } {
  const node = data.campaign.nodes.find((n) => n.id === s.nodeId)!;
  const map = data.maps[s.mapId]!;
  const result: BattleResult = {
    outcome: s.outcome === 'victory' ? 'victory' : 'defeat',
    nodeId: s.nodeId,
    turns: s.turn,
    side: [],
    gold: 0,
    materials: {},
    items: [],
    units: [],
    fallen: [],
    bounty: [],
    scars: [],
    recruited: [],
    supportsReady: [],
    granted: [],
  };
  if (result.outcome === 'defeat') return { campaign: c0, result };
  const c = clone(c0);
  const rng = clone(s.rng);
  const events: GameEvent[] = [];
  c.convoy = clone(s.convoy);
  c.nextUid = s.nextUid;
  const scarIds = data.campaign.scars.map((x) => x.id);
  const playerUnits = s.units.filter((u) => u.team === 'player' || (u.team === 'other' && !u.generic && u.gone !== 'dead'));
  for (const u of playerUnits) {
    const before = c0.roster.find((r) => r.id === u.id);
    const isNew = !before;
    if (isNew && (u.generic || !data.chars[u.id])) continue;
    const dies = u.gone === 'dead' || (u.downed && !u.gone);
    if (dies) {
      c.roster = c.roster.filter((r) => r.id !== u.id);
      const mercenary = !u.charId;
      c.fallen.push({ id: u.id, nameKey: u.nameKey, name: u.name, node: s.nodeId, classId: u.classId, portrait: u.portrait, ...(mercenary ? { mercenary: true as const } : {}) });
      result.fallen.push({ id: u.id, nameKey: u.nameKey, name: u.name, portrait: u.portrait, classId: u.classId, mercenary });
      c.convoy.push(...allItems(u));
      continue;
    }
    if (u.gone === 'rescued' && s.settings.deathMode === 'standard') {
      const free = scarIds.filter((x) => !u.scars.includes(x));
      if (free.length) {
        const scar = pick(rng, free);
        u.scars.push(scar);
        result.scars.push({ id: u.id, scar });
      }
    }
    if (u.pos || u.gone === 'rescued' || u.gone === 'escaped' || u.gone === 'retreated') {
      grantSp(data, u, data.balance.skills.spPerMissionEnd, events);
    }
    refill(data, allItems(u));
    if (u.grief && u.grief > 0) u.grief -= 1;
    const rec = toRecord(u);
    if (u.team === 'other') {
      // NPC allies with a story character join after the mission (e.g. Liora)
      const def = data.chars[u.id]!;
      const fresh = recordFromChar(data, def, c);
      fresh.equip = rec.equip;
      fresh.bag = rec.bag;
      c.roster.push(fresh);
      result.recruited.push(u.id);
      continue;
    }
    if (isNew) {
      c.roster.push(rec);
      result.recruited.push(u.id);
    } else {
      c.roster = c.roster.map((r) => (r.id === u.id ? rec : r));
    }
    result.units.push({
      id: u.id,
      nameKey: u.nameKey,
      name: u.name,
      levelBefore: before?.level ?? u.level,
      levelAfter: u.level,
      exp: u.battleExp ?? 0,
      capped: u.level >= levelCap(data) && levelCap(data) < data.balance.levels.max,
      portrait: u.portrait,
      classId: u.classId,
      mastered: events.filter((e) => e.t === 'mastered' && e.unit === u.uid).map((e) => (e as { skill: string }).skill),
    });
  }
  // grief: every surviving fixed support partner of a fallen companion from support rank C (GDD: −10 hit for 3 missions)
  for (const f of result.fallen) {
    if (f.mercenary) continue;
    f.grief = [];
    for (const { key, pair: [a, b] } of Object.values(data.supports)) {
      const partner = a === f.id ? b : b === f.id ? a : null;
      const rec = partner ? c.roster.find((r) => r.id === partner) : undefined;
      if (!rec) continue;
      if (!(s.supports[key] ?? c.supports[key])?.rank) continue;
      rec.grief = Math.max(rec.grief ?? 0, data.balance.supports.griefMissions);
      f.grief.push({ id: rec.id, missions: rec.grief });
    }
  }
  // lieutenants: met, encounters, and the grudge of those driven off (story 3.3)
  const lieutenantOutcomes = applyLieutenantOutcome(data, c, s);
  // side objectives
  for (const o of map.objectives.side) {
    const done = sideObjectiveDone(data, s, o);
    result.side.push({ id: o.id, type: o.type, done, reward: o.reward, turns: o.turns });
    if (!done) continue;
    if (o.reward.gold) s.goldGained += o.reward.gold;
    for (const [id, n] of Object.entries(o.reward.material ?? {})) s.materialsGained[id] = (s.materialsGained[id] ?? 0) + n;
    if (o.reward.item) {
      const inst = newItem(c, o.reward.item, data);
      c.convoy.push(inst);
      result.items.push(inst);
    }
  }
  for (const g of node.grants ?? []) {
    const rec = c.roster.find((r) => r.id === g.unit);
    const inst = newItem(c, g.item, data);
    if (rec) c.convoy.push(...autoEquip(data, rec, [inst]));
    else c.convoy.push(inst);
    result.granted.push({ id: g.unit, item: inst });
  }
  const gold = map.goldReward + s.goldGained;
  c.gold += gold;
  result.gold = gold;
  for (const [id, n] of Object.entries(s.materialsGained)) c.materials[id] = (c.materials[id] ?? 0) + n;
  result.materials = s.materialsGained;
  result.items.push(...s.itemsGained);
  // supports: keep only company pairs
  for (const key of Object.keys(c.supports)) {
    const st = s.supports[key];
    if (st) c.supports[key] = clone(st);
  }
  result.supportsReady = availableSupportTalks(data, c).map((x) => x.key);
  for (const f of s.flags) c.flags[f] ??= true;
  if (!c.completed.includes(s.nodeId)) c.completed.push(s.nodeId);
  noteRoles(data, c);
  // bounty and signature drop of the lieutenants driven off: the last draws from the battle RNG (story 3.5)
  result.bounty = payBounties(data, c, s, lieutenantOutcomes, rng);
  c.rng = rng;
  refreshOffers(data, c, node.merchantTier);
  refreshTavern(data, c);
  // dead units' gear in the convoy gets refilled as well
  refill(data, c.convoy);
  return { campaign: c, result };
}

/** Tavern offers of a chapter (story 6.4): `tavernOffersPerChapter` mercenaries near the level of the next mission. */
export function refreshTavern(data: GameData, c: CampaignState): void {
  const tav = data.balance.economy.tavern;
  const ctx = conditionContext(data, c);
  const classes = tav.classes.filter((k) => evalConditions(ctx, k.requires));
  const next = availableNodes(data, c).find((n) => n.kind === 'story') ?? availableNodes(data, c)[0];
  const expected = next?.expectedLevel ?? Math.max(1, ...c.roster.map((u) => u.level));
  c.tavern = [];
  if (!classes.length) return;
  for (let i = 0; i < data.balance.economy.tavernOffersPerChapter; i++) {
    const kind = pick(c.rng, classes);
    const level = Math.max(1, expected - nextInt(c.rng, tav.levelSpread + 1));
    const cls = data.classes[kind.class]!;
    const zero = { hp: 0, str: 0, mag: 0, skl: 0, spd: 0, lck: 0, def: 0, res: 0 };
    const rec: UnitRecord = {
      id: `merc${c.nextUid++}`,
      nameKey: pick(c.rng, tav.names),
      classId: kind.class,
      level,
      exp: 0,
      stats: genericStats(data, kind.class, level, 0),
      growth: clone(cls.growth),
      gained: { ...zero },
      expected: { ...zero },
      flags: [],
      equip: {},
      bag: [],
      scars: [],
      mastered: [],
      loadout: [],
      sp: {},
    };
    autoEquip(data, rec, kind.items.map((id) => newItem(c, id, data)));
    c.tavern.push(rec);
  }
}

/** Merchant special offers: 1–2 affixed items per chapter (concept/07 §1). */
export function refreshOffers(data: GameData, c: CampaignState, tier: number): void {
  const stock = merchantStock(data, tier).filter((id) => {
    const d = data.items[id]!;
    return ['weapon', 'armor', 'shield', 'accessory', 'tome'].includes(d.kind);
  });
  c.offers = [];
  if (!stock.length) return;
  const n = 1 + nextInt(c.rng, 2);
  for (let i = 0; i < n; i++) {
    const id = pick(c.rng, stock);
    const inst = newItem(c, id, data);
    inst.affixes = rollAffixes(data, c.rng, id, 'rare');
    c.offers.push(inst);
  }
}

export function merchantStock(data: GameData, tier: number): string[] {
  const out = new Set<string>();
  for (const s of data.campaign.merchant) if (s.tier <= tier) for (const id of s.items) out.add(id);
  return [...out];
}

export function currentTier(data: GameData, c: CampaignState): number {
  let t = 0;
  for (const id of c.completed) {
    const n = data.campaign.nodes.find((x) => x.id === id);
    if (n) t = Math.max(t, n.merchantTier);
  }
  return t;
}

export function addToRoster(data: GameData, c: CampaignState, charId: string): void {
  const def = data.chars[charId];
  if (!def || c.roster.some((r) => r.id === charId)) return;
  c.roster.push(recordFromChar(data, def, c, c.avatar));
}

export function statTotal(s: Stats): number {
  return s.hp + s.str + s.mag + s.skl + s.spd + s.lck + s.def + s.res;
}

export { autoEquip };
