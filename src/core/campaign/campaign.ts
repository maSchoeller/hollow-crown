import type { GameData, Mechanic, Reward, SideObjectiveDef, Stats } from '../defs';
import type { GameEvent } from '../events';
import { newItem, recordFromChar, autoEquip } from '../battle/create';
import { sideObjectiveDone } from '../battle/objectives';
import { rollAffixes } from '../loot';
import { nextInt, pick, seedRng } from '../rng';
import { allItems, itemDef } from '../rules/items';
import { grantSp } from '../rules/progression';
import type { AvatarSettings, BattleSettings, BattleState, BattleUnit, CampaignState, ItemInstance, UnitRecord } from '../state';
import { clone, pairKey } from '../util';

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
    flags: [],
    completed: [],
    available: [data.campaign.start],
    supports: {},
    nextUid: 1,
    offers: [],
  };
  for (const def of Object.values(data.chars)) {
    if (def.joins !== 'prologue') continue;
    c.roster.push(recordFromChar(data, def, c, avatar));
  }
  for (const ref of data.campaign.startConvoy) c.convoy.push(newItem(c, ref, data));
  for (const [a, b] of data.campaign.supportPairs) c.supports[pairKey(a, b)] = { points: 0, rank: null };
  return c;
}

export interface UnitResult {
  id: string;
  nameKey: string;
  name?: string;
  levelBefore: number;
  levelAfter: number;
  exp: number;
  mastered: string[];
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
  fallen: Array<{ id: string; nameKey: string; name?: string }>;
  scars: Array<{ id: string; scar: string }>;
  recruited: string[];
  supportsReady: string[];
  /** items handed to company members by the node (campaign.yaml `grants`) */
  granted: Array<{ id: string; item: ItemInstance }>;
}

/**
 * Mechanics not yet introduced at a node (concept/06 §10, gestaffelte Einführung). A mechanic applies from
 * its node in campaign.yaml `mechanics` onwards; if that node is not part of the campaign yet, it is locked.
 */
export function lockedMechanics(data: GameData, nodeId: string): Mechanic[] {
  const order = data.campaign.nodes.map((n) => n.id);
  const here = order.indexOf(nodeId);
  return (Object.entries(data.campaign.mechanics) as Array<[Mechanic, string]>)
    .filter(([, from]) => here < 0 || order.indexOf(from) < 0 || here < order.indexOf(from))
    .map(([m]) => m);
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
      c.fallen.push({ id: u.id, nameKey: u.nameKey, name: u.name, node: s.nodeId });
      result.fallen.push({ id: u.id, nameKey: u.nameKey, name: u.name });
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
      mastered: events.filter((e) => e.t === 'mastered' && e.unit === u.uid).map((e) => (e as { skill: string }).skill),
    });
  }
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
  result.supportsReady = Object.entries(c.supports)
    .filter(([key, st]) => {
      const next = (['C', 'B', 'A'] as const)[st.rank ? ['C', 'B', 'A'].indexOf(st.rank) + 1 : 0];
      return next && st.points >= data.balance.supports.thresholds[next] && !!data.campaign.supportDialogues[key]?.[next];
    })
    .map(([k]) => k);
  for (const f of s.flags) if (!c.flags.includes(f)) c.flags.push(f);
  if (!c.completed.includes(s.nodeId)) c.completed.push(s.nodeId);
  c.available = [...node.next];
  c.rng = rng;
  refreshOffers(data, c, node.merchantTier);
  // dead units' gear in the convoy gets refilled as well
  refill(data, c.convoy);
  return { campaign: c, result };
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
