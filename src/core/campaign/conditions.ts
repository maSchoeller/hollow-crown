import type { FlagValue, Stance, SupportRank } from '../defs';
import type { GameData } from '../gameData';
import type { Condition } from '../storyDefs';
import { STANCES, SUPPORT_RANKS } from '../defs';
import type { CampaignState, LieutenantState } from '../state';
import { pairKey } from '../util';

/**
 * Narrow view of the campaign that conditions read (architecture §5.3), so one function serves the camp,
 * dialogues and the battle set-up. Conditions never change anything.
 */
export interface ConditionContext {
  act: number;
  flags: Readonly<Record<string, FlagValue>>;
  /** companions in the company */
  roster: readonly string[];
  fallen: readonly string[];
  left: readonly string[];
  completed: readonly string[];
  /** completed story missions of this act (side quests do not count) */
  storyCount: number;
  supports: Readonly<Record<string, { rank: SupportRank | null }>>;
  stance: Readonly<Record<Stance, number>>;
  chronicle: readonly string[];
  /** what the company knows of each lieutenant it has met (story 3.3) */
  lieutenants: Readonly<Record<string, LieutenantState>>;
}

/** Condition keys whose state does not exist yet; `content:check` rejects them, `evalCondition` throws. */
export const UNSUPPORTED_CONDITIONS: readonly string[] = [];

/** Context of a campaign; `null` (no campaign running, e.g. a loose dialogue) is an empty story. */
export function conditionContext(data: GameData, c: CampaignState | null, extraFlags: Record<string, FlagValue> = {}): ConditionContext {
  if (!c)
    return {
      act: data.campaign.act,
      flags: extraFlags,
      roster: [],
      fallen: [],
      left: [],
      completed: [],
      storyCount: 0,
      supports: {},
      stance: { warm: 0, sober: 0, defiant: 0 },
      chronicle: [],
      lieutenants: {},
    };
  return {
    act: data.campaign.act,
    flags: { ...c.flags, ...extraFlags },
    roster: c.roster.map((r) => r.id),
    fallen: c.fallen.map((f) => f.id),
    left: c.left,
    completed: c.completed,
    storyCount: c.completed.filter((id) => data.campaign.nodes.some((n) => n.id === id && n.kind === 'story')).length,
    supports: c.supports,
    stance: c.stance,
    chronicle: c.chronicle,
    lieutenants: c.lieutenants ?? {},
  };
}

/** The prevailing stance; a tie is decided warm > sober > defiant, no points = none. */
export function dominantStance(stance: Readonly<Record<Stance, number>>): Stance | null {
  let best: Stance | null = null;
  for (const s of STANCES) if (stance[s] > 0 && (best === null || stance[s] > stance[best])) best = s;
  return best;
}

/** The single key of a condition or effect object (the schema guarantees there is exactly one). */
export function soleKey(o: object): string {
  const keys = Object.keys(o);
  if (keys.length !== 1) throw new Error(`expected exactly one key, got ${keys.length}`);
  return keys[0]!;
}

/** `flag: name` is true when the flag is set (any value); `flag: { name: value }` when it has exactly that value. */
function flagHolds(ctx: ConditionContext, flag: string | Record<string, FlagValue>): boolean {
  if (typeof flag === 'string') return ctx.flags[flag] !== undefined;
  const key = soleKey(flag);
  return ctx.flags[key] === flag[key];
}

export function evalCondition(ctx: ConditionContext, cond: Condition): boolean {
  const key = soleKey(cond);
  const v = (cond as unknown as Record<string, unknown>)[key];
  switch (key) {
    case 'flag':
      return flagHolds(ctx, v as string | Record<string, FlagValue>);
    case 'alive':
      return ctx.roster.includes(v as string);
    case 'dead':
      return ctx.fallen.includes(v as string);
    case 'left':
      return ctx.left.includes(v as string);
    case 'completed':
      return ctx.completed.includes(v as string);
    case 'storyCount': {
      const r = v as { min?: number; max?: number };
      return ctx.storyCount >= (r.min ?? 0) && ctx.storyCount <= (r.max ?? Infinity);
    }
    case 'act':
      return ctx.act >= (v as number);
    case 'support': {
      const s = v as { pair: [string, string]; rank: SupportRank };
      const have = ctx.supports[pairKey(s.pair[0], s.pair[1])]?.rank;
      return !!have && SUPPORT_RANKS.indexOf(have) >= SUPPORT_RANKS.indexOf(s.rank);
    }
    case 'stance':
      return dominantStance(ctx.stance) === v;
    case 'chronicle':
      return Array.isArray(v) ? (v as string[]).every((p) => ctx.chronicle.includes(p)) : ctx.chronicle.length >= (v as { min: number }).min;
    case 'met':
      return ctx.lieutenants[v as string]?.met === true;
    case 'any':
      return (v as Condition[]).some((x) => evalCondition(ctx, x));
    case 'not':
      return !evalCondition(ctx, v as Condition);
    default:
      throw new Error(`condition not yet supported: ${key}`);
  }
}

/** A list means AND; an empty list is true. */
export function evalConditions(ctx: ConditionContext, conds: Condition | readonly Condition[] | undefined): boolean {
  if (!conds) return true;
  return (Array.isArray(conds) ? (conds as readonly Condition[]) : [conds as Condition]).every((x) => evalCondition(ctx, x));
}

/** Every key a condition (and its nested conditions) uses, for the reference checks of `content:check`. */
export function conditionKeys(cond: Condition, out: string[] = []): string[] {
  const key = soleKey(cond);
  out.push(key);
  const v = (cond as unknown as Record<string, unknown>)[key];
  if (key === 'any') for (const x of v as Condition[]) conditionKeys(x, out);
  if (key === 'not') conditionKeys(v as Condition, out);
  return out;
}

/**
 * The map units whose own `requires` hold against the campaign (story 9.5): a foe who is only there on some way of the story
 * (e.g. not after a decision). Evaluated when the battle is created, so the start state of a replay already holds the filtered list.
 */
export function onConditions<T extends { requires?: Condition[] }>(ctx: ConditionContext, defs: readonly T[]): T[] {
  return defs.filter((d) => evalConditions(ctx, d.requires));
}
