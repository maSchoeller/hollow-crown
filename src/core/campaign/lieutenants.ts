/**
 * What the campaign remembers of a lieutenant (story 3.3, architecture §5.5): meetings, rout count and the grudge
 * against whoever drove him off; and which line he speaks at first sight. Pure: no Babylon, no DOM, no randomness.
 */
import type { BattleState, BattleUnit, CampaignState, ItemInstance, LieutenantPlan, LieutenantState } from '../state';
import { STAT_KEYS, type Difficulty, type ItemRef } from '../defs';
import type { GameData } from '../gameData';
import type { MapDef, MapUnitDef } from '../mapDefs';
import type { LieutenantDef } from '../storyDefs';
import { autoEquip, newItem, recordFromChar, roundDiv } from '../battle/create';
import { nextFloat, nextInt, type RngState } from '../rng';
import { allItems } from '../rules/items';
import { growthRate } from '../rules/progression';
import { effectiveLevel } from '../rules/skills';
import { fogOn, visibleTiles } from '../rules/vision';
import { onDifficulty, posKey } from '../util';
import type { BountyResult } from './campaign';
import { takeItem } from './camp';
import type { CampaignEvent } from './commands';

/** The highest grudge (GDD: Groll 0-3), from `balance.lieutenant.grudge.max`. */
export const grudgeMax = (data: Pick<GameData, 'balance'>): number => data.balance.lieutenant.grudge.max;

/** The line of a grudge step: 1 -> `grudge_1` and so on (`content:check` keeps the lines at `grudgeMax`). */
const grudgeLine = (step: number): LieutenantLinePick['line'] => `grudge_${step}` as LieutenantLinePick['line'];

/** A lieutenant the company has not met. */
export const newLieutenantState = (): LieutenantState => ({ met: false, encounters: 0, grudge: 0, routs: 0, signatureDropped: false });

/** The state of one lieutenant with defaults for whatever the campaign does not hold yet (an older `signatureDropped` 0/1 becomes false/true). */
export const lieutenantState = (c: Pick<CampaignState, 'lieutenants'>, id: string): LieutenantState => {
  const raw = c.lieutenants?.[id];
  return { ...newLieutenantState(), ...raw, signatureDropped: !!raw?.signatureDropped };
};

/** The flag a lieutenant sets when he joins the company (story 3.7, `flags.yaml`). */
export const joinedFlag = (lt: string): string => `joined_${lt}`;

/** Whether the lieutenant has joined the company (story 3.7): from then on he is a companion, no longer a foe. */
export const isJoined = (c: Pick<CampaignState, 'flags'>, lt: string): boolean => c.flags[joinedFlag(lt)] === true;

/**
 * The lieutenants still against the company: all of the act data without those who joined (story 3.7). Haunts (5.5/5.6)
 * and finale line-ups read this list, never `data.lieutenants` directly. In the order of the content.
 */
export const activeLieutenants = (data: Pick<GameData, 'lieutenants'>, c: Pick<CampaignState, 'flags'>): LieutenantDef[] =>
  Object.values(data.lieutenants ?? {}).filter((lt) => !isJoined(c, lt.id));

/** Keeps a grudge inside 0-3. */
export const clampGrudge = (data: Pick<GameData, 'balance'>, n: number): number => Math.max(0, Math.min(grudgeMax(data), n));

/**
 * The level of a lieutenant (story 3.4, GDD Leutnants): the average of the effective levels of the strongest
 * `lieutenant.scaling.armySize` units of the company (`c.roster`; a pro class counts +15), rounded commercially (x.5 up),
 * plus the grudge. Fewer units than that: the average of those there are. Story 3.7 calls it with grudge 0 for a lieutenant who joins.
 */
export function lieutenantLevel(data: GameData, c: Pick<CampaignState, 'roster'>, grudge: number): number {
  const top = c.roster
    .map((u) => effectiveLevel(data, u))
    .sort((a, b) => b - a)
    .slice(0, Math.max(1, data.balance.lieutenant.scaling.armySize));
  const avg = top.length ? roundDiv(top.reduce((a, b) => a + b, 0), top.length) : 1;
  return Math.max(1, avg) + clampGrudge(data, grudge);
}

/** The grudge skills a lieutenant holds at `grudge`: the first `grudge` of his three (0: none, 3: all). */
export const lieutenantSkills = (data: Pick<GameData, 'balance'>, def: Pick<LieutenantDef, 'grudgeSkills'>, grudge: number): string[] => def.grudgeSkills.slice(0, clampGrudge(data, Math.floor(grudge)));

/** A weapon `steps` tiers higher in its group along `lieutenant.scaling.tierUp`; where the chain ends, the last one stays. */
export function tierUpItem(data: GameData, itemId: string, steps: number): string {
  const chain = data.balance.lieutenant.scaling.tierUp;
  let id = itemId;
  for (let i = 0; i < steps; i++) {
    const next = chain[id];
    if (!next) break;
    id = next;
  }
  return id;
}

/**
 * The items a lieutenant carries into battle: those of his map unit, each weapon on the chain `grudge` tiers up, never
 * his signature item (that is loot only, story 3.5). Items that are no weapon on the chain stay as they are. The list keeps
 * its order so `drops` can be mapped; `kept` lists the positions in `refs` of the items that remain.
 */
export function lieutenantItems(data: GameData, def: Pick<LieutenantDef, 'signatureItem'>, refs: readonly ItemRef[], grudge: number): { items: ItemRef[]; kept: number[] } {
  const items: ItemRef[] = [];
  const kept: number[] = [];
  refs.forEach((r, i) => {
    if (r.def === def.signatureItem) return;
    items.push({ ...r, def: tierUpItem(data, r.def, clampGrudge(data, grudge)) });
    kept.push(i);
  });
  return { items, kept };
}

/**
 * A map unit as the battle builds it: for a lieutenant (known in the content) the level from the company and his grudge,
 * the tiered items and the grudge skills; the level on the map is ignored. Any other unit comes back unchanged.
 */
export function lieutenantUnit(data: GameData, c: Pick<CampaignState, 'roster' | 'lieutenants'>, def: MapUnitDef): { def: MapUnitDef; skills: string[] } {
  const lt = def.lieutenant ? data.lieutenants?.[def.lieutenant] : undefined;
  if (!lt) return { def, skills: [] };
  const grudge = lieutenantState(c, lt.id).grudge;
  const { items, kept } = lieutenantItems(data, lt, def.items, grudge);
  const drops = def.drops?.map((i) => kept.indexOf(i)).filter((i) => i >= 0);
  return {
    def: { ...def, level: lieutenantLevel(data, c, grudge), items, ...(drops ? { drops } : {}) },
    skills: lieutenantSkills(data, lt, grudge),
  };
}

/** Every unit definition of a map that is on the board at `difficulty`: line-up, reinforcements and the spawns of triggers. */
function mapUnitDefs(map: Pick<MapDef, 'units' | 'reinforcements' | 'triggers'>, difficulty: Difficulty): MapUnitDef[] {
  const out = [...onDifficulty(map.units, difficulty)];
  for (const r of map.reinforcements) out.push(...onDifficulty(r.units, difficulty));
  for (const t of map.triggers) for (const a of t.then) if (a.action === 'spawn') out.push(...onDifficulty(a.units, difficulty));
  return out;
}

/**
 * The plan of every lieutenant on the map (review R1): what `lieutenantUnit` makes of him, for the line-up, the reinforcements
 * and the trigger spawns alike. Lieutenants who joined the company are not in it. One lieutenant appears once per map and
 * difficulty (`content:check`); should a map name him twice, the first definition counts.
 */
export function planLieutenants(data: GameData, c: Pick<CampaignState, 'roster' | 'lieutenants' | 'flags'>, map: Pick<MapDef, 'units' | 'reinforcements' | 'triggers'>, difficulty: Difficulty): Record<string, LieutenantPlan> {
  const plan: Record<string, LieutenantPlan> = {};
  for (const def of mapUnitDefs(map, difficulty)) {
    const id = def.lieutenant;
    if (!id || !data.lieutenants?.[id] || isJoined(c, id) || plan[id]) continue;
    const scaled = lieutenantUnit(data, c, def);
    const st = c.lieutenants?.[id];
    plan[id] = {
      level: scaled.def.level,
      items: scaled.def.items,
      ...(scaled.def.drops ? { drops: scaled.def.drops } : {}),
      skills: scaled.skills,
      ...(st ? { grudge: st.grudge, ...(st.target ? { target: st.target } : {}) } : {}),
    };
  }
  return plan;
}

/**
 * A lieutenant joins the company (effect `recruit: { lt }`, story 3.7), mutating `c`, which the caller owns. He becomes a
 * companion of his character definition: the level is the growing strength without grudge (`lieutenantLevel`, never
 * below the level of the definition), the stats the expected values from the definition's base level (base + growth % x
 * levels above it, commercial rounding, class caps), his gear the definition's items. When the company already holds his
 * signature item (story 3.5) he takes that one instead of a second. The grudge against him and from him lapses, the flag
 * `joined_<lt>` is set and `companionJoined` is reported (never `unitJoined`). A second call changes nothing.
 */
export function joinLieutenant(data: GameData, c: CampaignState, id: string, events: CampaignEvent[]): void {
  const def = data.chars[id];
  const lt = data.lieutenants?.[id];
  if (!def || !lt || isJoined(c, id) || c.roster.some((r) => r.id === id)) return;
  const level = Math.max(def.level, lieutenantLevel(data, c, 0));
  // the signature item the company holds already (convoy, bag or hand) goes to him; otherwise a new one is made
  const held: ItemInstance | undefined = [...c.convoy, ...c.roster.flatMap((u) => allItems(u))].find((i) => i.def === lt.signatureItem);
  const kept = held ? takeItem(c, held.uid) : null;
  const rec = recordFromChar(data, { ...def, items: [] }, c, c.avatar);
  const left = autoEquip(data, rec, def.items.map((r) => (r.def === lt.signatureItem && kept ? kept : newItem(c, r, data))));
  c.convoy.push(...left);
  rec.level = level;
  const steps = level - def.level;
  const caps = data.classes[def.class]!.caps;
  for (const k of STAT_KEYS) {
    const rate = Math.max(0, growthRate(data, rec, k));
    const gain = Math.min(roundDiv(rate * steps, 100), Math.max(0, caps[k] - def.base[k]));
    rec.stats[k] = def.base[k] + gain;
    rec.gained[k] = gain;
    rec.expected[k] = (rate * steps) / 100;
  }
  c.roster.push(rec);
  c.left = c.left.filter((x) => x !== id);
  // the grudge lapses on both sides: his own, and the target of any other lieutenant's that was he
  const lieutenants = (c.lieutenants ??= {});
  const own = lieutenantState(c, id);
  const had = own.grudge;
  delete own.target;
  own.grudge = 0;
  lieutenants[id] = own;
  for (const [other, st] of Object.entries(lieutenants)) {
    if (other === id || st.target !== id) continue;
    const { target: _gone, ...rest } = st;
    lieutenants[other] = rest;
  }
  events.push({ t: 'companionJoined', unit: id });
  if (had > 0) events.push({ t: 'grudgeChanged', lt: id, grudge: 0 });
  c.flags[joinedFlag(id)] = true;
  events.push({ t: 'flagSet', flag: joinedFlag(id), value: true });
}

/** One lieutenant after a won mission (story 3.5 hangs bounty and signature drop on this list). */
export interface LieutenantOutcome {
  id: string;
  /** driven off in this mission (`gone: 'fled'`) */
  routed: boolean;
  /** the grudge before this rout raised it (the bounty is paid for this level) */
  grudgeBefore: number;
  /** roster id of the unit that drove him off; absent when nobody or not a unit of the company */
  by?: string;
}

/**
 * Applies the lieutenants of a won mission to `c`, which the caller has already copied: every lieutenant the company met in
 * the mission (it saw him on the board, `s.ltSeen`, or drove him off) counts one more `encounters` and is `met`; one who fled
 * also counts a rout, raises the grudge by one (up to three) and points it at the unit that drove him off. A lieutenant on
 * the map the company never saw is left as he was. A driver who is no unit of the company (an allied NPC) leaves the
 * target as it was. A defeat never gets here.
 */
export function applyLieutenantOutcome(data: GameData, c: CampaignState, s: BattleState): LieutenantOutcome[] {
  const out: LieutenantOutcome[] = [];
  const seen = new Set(s.ltSeen ?? []);
  for (const u of s.units) {
    if (!u.lieutenant || !data.lieutenants?.[u.lieutenant] || isJoined(c, u.lieutenant)) continue;
    const routed = u.gone === 'fled';
    if (!routed && !seen.has(u.lieutenant)) continue;
    const lt = lieutenantState(c, u.lieutenant);
    lt.encounters += 1;
    lt.met = true;
    const grudgeBefore = lt.grudge;
    const by = routed ? driverId(s, u) : undefined;
    if (routed) {
      lt.routs += 1;
      lt.grudge = clampGrudge(data, lt.grudge + 1);
      if (by) lt.target = by;
    }
    (c.lieutenants ??= {})[u.lieutenant] = lt;
    out.push({ id: u.lieutenant, routed, grudgeBefore, ...(by ? { by } : {}) });
  }
  return out;
}

/** The material a rout of lieutenant `id` pays: that of the act he belongs to (review R5), not the act the campaign is in. */
export const bountyMaterialId = (data: GameData, id: string): string | undefined => {
  const act = data.lieutenants?.[id]?.act;
  return act === undefined ? undefined : data.balance.lieutenant.bounty.materialByAct[String(act)];
};

/** Gold bounty for driving a lieutenant off who held `grudgeBefore` notches before this rout: `goldPerLevel x (grudge + 1)`. Also shown on the wanted posters (story 3.6). */
export const bountyGold = (data: GameData, grudgeBefore: number): number => data.balance.lieutenant.bounty.goldPerLevel * (clampGrudge(data, grudgeBefore) + 1);

/**
 * Pays the bounty of every lieutenant driven off (story 3.5) into `c` (a copy the caller owns): gold, one to two of the
 * act's material, and his signature item when it falls (chance per rout, for sure at the rout number `guaranteedRout`,
 * once per lieutenant); `goldPercent` scales the gold only. Call after `applyLieutenantOutcome` (the routs are counted already). Draws from `rng` in a fixed
 * order: lieutenants in the order of `outcomes`; for each first the material amount, then the signature roll, both
 * always. Nothing is drawn when nobody fled.
 */
export function payBounties(data: GameData, c: CampaignState, s: BattleState, outcomes: readonly LieutenantOutcome[], rng: RngState, goldPercent = 100): BountyResult[] {
  const cfg = data.balance.lieutenant;
  const out: BountyResult[] = [];
  for (const o of outcomes) {
    if (!o.routed || isJoined(c, o.id)) continue;
    const materialId = bountyMaterialId(data, o.id);
    const u = s.units.find((x) => x.lieutenant === o.id);
    const lt = lieutenantState(c, o.id);
    // a haunt after the `haunt.halveFromNth`-th since the last story mission pays half the gold (story 5.6)
    const gold = Math.round((bountyGold(data, o.grudgeBefore) * goldPercent) / 100);
    const { min, max } = cfg.bounty.materials;
    const count = min + nextInt(rng, max - min + 1);
    const roll = nextFloat(rng) < cfg.signature.chance;
    const drop = !lt.signatureDropped && (roll || lt.routs >= cfg.signature.guaranteedRout);
    c.gold += gold;
    const res: BountyResult = { id: o.id, nameKey: u?.nameKey ?? `unit.${o.id}.name`, gold, grudge: lt.grudge };
    if (u?.name) res.name = u.name;
    if (u?.portrait) res.portrait = u.portrait;
    if (materialId && count > 0) {
      c.materials[materialId] = (c.materials[materialId] ?? 0) + count;
      res.material = { id: materialId, count };
    }
    if (drop) {
      const item = newItem(c, data.lieutenants[o.id]!.signatureItem, data);
      c.convoy.push(item);
      lt.signatureDropped = true;
      (c.lieutenants ??= {})[o.id] = lt;
      res.signature = item;
    }
    out.push(res);
  }
  return out;
}

/** Roster id of the unit that drove `u` off, when it stands on the player's side (allied NPCs are team `other`). */
function driverId(s: BattleState, u: BattleUnit): string | undefined {
  const by = u.fledBy ? s.units.find((x) => x.uid === u.fledBy) : undefined;
  return by && by.team === 'player' ? by.id : undefined;
}

/**
 * Whether the player can see `unit` right now (story 3.2): without fog always, under fog when the unit's tile is one
 * the player's side sees (`vision.ts`). `seen` is the player's sight when the caller has it already.
 */
export function isVisibleToPlayer(data: GameData, s: BattleState, unit: BattleUnit, seen?: ReadonlySet<string>): boolean {
  if (!fogOn(data, s)) return true;
  return !!unit.pos && (seen ?? visibleTiles(data, s, 'player')).has(posKey(unit.pos));
}

/** The line a lieutenant speaks at first sight: the scene line id and the roster/fallen id of the grudge target. */
export interface LieutenantLinePick {
  line: 'first' | 'grudge_1' | 'grudge_2' | 'grudge_3' | 'mock';
  target?: string;
}

/**
 * Which line `unit` speaks at first sight, or `null`. Not met yet: `first`. Grudge 1 or more against a unit still in
 * the company: `grudge_<n>`. The target has fallen: `mock` (the grudge stays until the next rout sets a new target).
 * Met with no grudge, a grudge without a target, or a target who left the company: no line.
 */
export function ltOpeningLine(data: Pick<GameData, 'balance'>, c: Pick<CampaignState, 'lieutenants' | 'roster' | 'fallen' | 'flags'>, unit: BattleUnit): LieutenantLinePick | null {
  if (!unit.lieutenant || isJoined(c, unit.lieutenant)) return null;
  if (!c.lieutenants?.[unit.lieutenant]?.met) return { line: 'first' };
  const grudge = unit.grudge ?? 0;
  const target = unit.grudgeTarget;
  if (grudge < 1 || !target) return null;
  if (c.roster.some((r) => r.id === target)) return { line: grudgeLine(clampGrudge(data, grudge)), target };
  if (c.fallen.some((f) => f.id === target)) return { line: 'mock', target };
  return null;
}

/** An opening line due now: which unit speaks it. */
export interface LieutenantLineDue extends LieutenantLinePick {
  unit: string;
  lieutenant: string;
}

/**
 * Opening lines that are due: one for each lieutenant on the board the player sees and who has not spoken yet
 * (`spoken` = unit uids). The caller remembers who spoke, so each lieutenant speaks once per battle; units in
 * the order of the state.
 */
export function ltLinesDue(
  data: GameData,
  c: Pick<CampaignState, 'lieutenants' | 'roster' | 'fallen' | 'flags'>,
  s: BattleState,
  spoken: ReadonlySet<string>,
): LieutenantLineDue[] {
  const out: LieutenantLineDue[] = [];
  const seen = fogOn(data, s) ? visibleTiles(data, s, 'player') : undefined;
  for (const u of s.units) {
    if (!u.lieutenant || spoken.has(u.uid) || u.team !== 'enemy' || !u.pos || u.gone || u.downed || !isVisibleToPlayer(data, s, u, seen)) continue;
    const pick = ltOpeningLine(data, c, u);
    if (pick) out.push({ ...pick, unit: u.uid, lieutenant: u.lieutenant });
  }
  return out;
}

/** The line a fleeing lieutenant speaks: by the routs he has suffered before this one, 0 -> `flee_1`, 1 -> `flee_2`, 2 -> `flee_3`, then again from the first. */
export const FLEE_LINES = ['flee_1', 'flee_2', 'flee_3'] as const;

export function ltFleeLine(c: Pick<CampaignState, 'lieutenants'>, lieutenantId: string): (typeof FLEE_LINES)[number] {
  const routs = Math.max(0, Math.floor(lieutenantState(c, lieutenantId).routs));
  return FLEE_LINES[routs % FLEE_LINES.length]!;
}
