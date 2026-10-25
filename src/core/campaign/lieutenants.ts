/**
 * What the campaign remembers of a lieutenant (story 3.3, architecture §5.5): meetings, rout count and the grudge
 * against whoever drove him off; and which line he speaks at first sight. Pure: no Babylon, no DOM, no randomness.
 */
import type { BattleState, BattleUnit, CampaignState, LieutenantState } from '../state';
import type { GameData } from '../defs';
import { newItem } from '../battle/create';
import { nextFloat, nextInt, type RngState } from '../rng';
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

/** Whether the player can see `unit` right now. No fog yet (story 2.6), so everything on the board is seen. */
export function isVisibleToPlayer(_s: BattleState, _unit: BattleUnit): boolean {
  return true;
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
export function ltLinesDue(c: Pick<CampaignState, 'lieutenants' | 'roster' | 'fallen'>, s: BattleState, spoken: ReadonlySet<string>): LieutenantLineDue[] {
  const out: LieutenantLineDue[] = [];
  for (const u of s.units) {
    if (!u.lieutenant || spoken.has(u.uid) || u.team !== 'enemy' || !u.pos || u.gone || u.downed || !isVisibleToPlayer(s, u)) continue;
    const pick = ltOpeningLine(c, u);
    if (pick) out.push({ ...pick, unit: u.uid, lieutenant: u.lieutenant });
  }
  return out;
}
