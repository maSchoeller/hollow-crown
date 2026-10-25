/**
 * What the campaign remembers of a lieutenant (story 3.3, architecture §5.5): meetings, rout count and the grudge
 * against whoever drove him off; and which line he speaks at first sight. Pure: no Babylon, no DOM, no randomness.
 */
import type { BattleState, BattleUnit, CampaignState, LieutenantState } from '../state';
import type { GameData, ItemRef, LieutenantDef, MapUnitDef } from '../defs';
import { newItem, roundDiv } from '../battle/create';
import { nextFloat, nextInt, type RngState } from '../rng';
import { effectiveLevel } from '../rules/skills';
import { fogOn, visibleTiles } from '../rules/vision';
import { posKey } from '../util';
import type { BountyResult } from './campaign';

/** The grudge never goes above three notches (GDD: Groll 0-3). */
export const GRUDGE_MAX = 3;

const GRUDGE_LINES = ['grudge_1', 'grudge_2', 'grudge_3'] as const;

/** A lieutenant the company has not met. */
export const newLieutenantState = (): LieutenantState => ({ met: false, encounters: 0, grudge: 0, routs: 0, signatureDropped: false });

/** The state of one lieutenant with defaults for whatever the campaign does not hold yet (an older `signatureDropped` 0/1 becomes false/true). */
export const lieutenantState = (c: Pick<CampaignState, 'lieutenants'>, id: string): LieutenantState => {
  const raw = c.lieutenants?.[id];
  return { ...newLieutenantState(), ...raw, signatureDropped: !!raw?.signatureDropped };
};

/** Keeps a grudge inside 0-3. */
export const clampGrudge = (n: number): number => Math.max(0, Math.min(GRUDGE_MAX, n));

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
  return Math.max(1, avg) + clampGrudge(grudge);
}

/** The grudge skills a lieutenant holds at `grudge`: the first `grudge` of his three (0: none, 3: all). */
export const lieutenantSkills = (def: Pick<LieutenantDef, 'grudgeSkills'>, grudge: number): string[] => def.grudgeSkills.slice(0, clampGrudge(Math.floor(grudge)));

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
    items.push({ ...r, def: tierUpItem(data, r.def, clampGrudge(grudge)) });
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
    skills: lieutenantSkills(lt, grudge),
  };
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
 * Applies the lieutenants of a won mission to `c`, which the caller has already copied: every lieutenant on the map
 * counts one more `encounters` and is `met`; one who fled also counts a rout, raises the grudge by one (up to three)
 * and points it at the unit that drove him off. A driver who is no unit of the company (an allied NPC) leaves the
 * target as it was. A defeat never gets here.
 */
export function applyLieutenantOutcome(data: GameData, c: CampaignState, s: BattleState): LieutenantOutcome[] {
  const out: LieutenantOutcome[] = [];
  for (const u of s.units) {
    if (!u.lieutenant || !data.lieutenants?.[u.lieutenant]) continue;
    const lt = lieutenantState(c, u.lieutenant);
    lt.encounters += 1;
    lt.met = true;
    const routed = u.gone === 'fled';
    const grudgeBefore = lt.grudge;
    const by = routed ? driverId(s, u) : undefined;
    if (routed) {
      lt.routs += 1;
      lt.grudge = clampGrudge(lt.grudge + 1);
      if (by) lt.target = by;
    }
    (c.lieutenants ??= {})[u.lieutenant] = lt;
    out.push({ id: u.lieutenant, routed, grudgeBefore, ...(by ? { by } : {}) });
  }
  return out;
}

/** Gold bounty for driving a lieutenant off who held `grudgeBefore` notches before this rout: `goldPerLevel x (grudge + 1)`. Also shown on the wanted posters (story 3.6). */
export const bountyGold = (data: GameData, grudgeBefore: number): number => data.balance.lieutenant.bounty.goldPerLevel * (clampGrudge(grudgeBefore) + 1);

/**
 * Pays the bounty of every lieutenant driven off (story 3.5) into `c` (a copy the caller owns): gold, one to two of the
 * act's material, and his signature item when it falls (chance per rout, for sure at the rout number `guaranteedRout`,
 * once per lieutenant). Call after `applyLieutenantOutcome` (the routs are counted already). Draws from `rng` in a fixed
 * order: lieutenants in the order of `outcomes`; for each first the material amount, then the signature roll, both
 * always. Nothing is drawn when nobody fled.
 */
export function payBounties(data: GameData, c: CampaignState, s: BattleState, outcomes: readonly LieutenantOutcome[], rng: RngState): BountyResult[] {
  const cfg = data.balance.lieutenant;
  const materialId = cfg.bounty.materialByAct[String(data.campaign.act)];
  const out: BountyResult[] = [];
  for (const o of outcomes) {
    if (!o.routed) continue;
    const u = s.units.find((x) => x.lieutenant === o.id);
    const lt = lieutenantState(c, o.id);
    const gold = bountyGold(data, o.grudgeBefore);
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
export function ltOpeningLine(c: Pick<CampaignState, 'lieutenants' | 'roster' | 'fallen'>, unit: BattleUnit): LieutenantLinePick | null {
  if (!unit.lieutenant) return null;
  if (!c.lieutenants?.[unit.lieutenant]?.met) return { line: 'first' };
  const grudge = unit.grudge ?? 0;
  const target = unit.grudgeTarget;
  if (grudge < 1 || !target) return null;
  if (c.roster.some((r) => r.id === target)) return { line: GRUDGE_LINES[clampGrudge(grudge) - 1]!, target };
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
  c: Pick<CampaignState, 'lieutenants' | 'roster' | 'fallen'>,
  s: BattleState,
  spoken: ReadonlySet<string>,
): LieutenantLineDue[] {
  const out: LieutenantLineDue[] = [];
  const seen = fogOn(data, s) ? visibleTiles(data, s, 'player') : undefined;
  for (const u of s.units) {
    if (!u.lieutenant || spoken.has(u.uid) || u.team !== 'enemy' || !u.pos || u.gone || u.downed || !isVisibleToPlayer(data, s, u, seen)) continue;
    const pick = ltOpeningLine(c, u);
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
