/**
 * Deploy on the board (story 6.11): which unit starts on which deploy slot. Pure rules, shared by the battle setup, the
 * deploy screen and the tests. A bare list of ids still means the default deploy (autoplay, sim, lab, older callers).
 */
import type { Pos } from '../defs';
import type { MapDef } from '../mapDefs';
import { samePos } from '../util';

/** One unit on its start field. */
export interface Placed {
  id: string;
  at: Pos;
}
export type Placement = Placed[];
/** What a battle starts with: the chosen ids in order (default fields) or a placement. */
export type Deploy = readonly string[] | readonly Placed[];

/** The deploy rules of a map for one company: its slots, how many may go, who must go (present forced units). */
export interface DeployRules {
  slots: readonly Pos[];
  max: number;
  forced: readonly string[];
}

export function deployRules(map: Pick<MapDef, 'deploy'>, forced: readonly string[]): DeployRules {
  return { slots: map.deploy.slots, max: Math.min(map.deploy.max, map.deploy.slots.length), forced };
}

const isPlacement = (d: Deploy): d is readonly Placed[] => d.length > 0 && typeof d[0] !== 'string';

/** The default deploy: forced units first, then the chosen ones, on the slots in their order up to the limit. */
export function defaultPlacement(r: DeployRules, ids: readonly string[]): Placement {
  const chosen = [...r.forced, ...ids.filter((id) => !r.forced.includes(id))];
  return chosen.slice(0, r.max).map((id, i) => ({ id, at: [r.slots[i]![0], r.slots[i]![1]] as Pos }));
}

/**
 * The placement a battle starts with. A list of ids is the default deploy. A placement keeps its order; entries on no slot, a
 * second entry of a unit or of a field, units not in `known` and those over the limit drop out, and a forced unit that is
 * missing goes to the first free slot (pushing out the last chosen one when all places are taken). Forced units never miss.
 */
export function placementFor(r: DeployRules, d: Deploy, known: (id: string) => boolean): Placement {
  if (!isPlacement(d)) return defaultPlacement(r, d as readonly string[]);
  const out: Placement = [];
  for (const p of d) {
    if (!known(p.id) || !isSlot(r, p.at) || out.some((o) => o.id === p.id || samePos(o.at, p.at))) continue;
    out.push({ id: p.id, at: [p.at[0], p.at[1]] });
  }
  while (out.length > r.max) dropLastFree(out, r.forced);
  for (const id of r.forced) {
    if (out.some((o) => o.id === id)) continue;
    if (out.length >= r.max) dropLastFree(out, r.forced);
    const free = r.slots.find((s) => !out.some((o) => samePos(o.at, s)));
    if (free) out.push({ id, at: [free[0], free[1]] });
  }
  return out;
}

function dropLastFree(out: Placement, forced: readonly string[]): void {
  for (let i = out.length - 1; i >= 0; i--) {
    if (!forced.includes(out[i]!.id)) {
      out.splice(i, 1);
      return;
    }
  }
  out.pop();
}

export const isSlot = (r: DeployRules, p: Pos): boolean => r.slots.some((s) => samePos(s, p));
export const placedAt = (p: readonly Placed[], at: Pos): Placed | undefined => p.find((o) => samePos(o.at, at));

/** Why a placement step did nothing: not a deploy slot, all places taken, a forced unit cannot go to the bench. */
export type DeployBlock = 'slot' | 'full' | 'locked';
export interface DeployStep {
  placement: Placement;
  blocked: DeployBlock | null;
}

/**
 * Puts unit `id` on slot `at`. A unit on the board moves to a free slot or swaps with the one standing there. A unit from the
 * bench takes a free slot while places are left, or takes the place of the one standing there, who goes to the bench (not a forced one).
 */
export function placeUnit(r: DeployRules, p: readonly Placed[], id: string, at: Pos): DeployStep {
  const keep = { placement: p.map((o) => ({ ...o })), blocked: null };
  if (!isSlot(r, at)) return { ...keep, blocked: 'slot' };
  const here = placedAt(p, at);
  const self = p.find((o) => o.id === id);
  if (here?.id === id) return keep;
  if (self) {
    return { placement: p.map((o) => (o.id === id ? { id, at: [at[0], at[1]] } : here && o.id === here.id ? { id: o.id, at: self.at } : { ...o })), blocked: null };
  }
  if (here) {
    if (r.forced.includes(here.id)) return { ...keep, blocked: 'locked' };
    return { placement: p.map((o) => (o.id === here.id ? { id, at: [at[0], at[1]] } : { ...o })), blocked: null };
  }
  if (p.length >= r.max) return { ...keep, blocked: 'full' };
  return { placement: [...p.map((o) => ({ ...o })), { id, at: [at[0], at[1]] }], blocked: null };
}

/** Takes unit `id` off the board (to the bench). A forced unit stays. */
export function benchUnit(r: DeployRules, p: readonly Placed[], id: string): DeployStep {
  if (r.forced.includes(id)) return { placement: p.map((o) => ({ ...o })), blocked: 'locked' };
  return { placement: p.filter((o) => o.id !== id).map((o) => ({ ...o })), blocked: null };
}
