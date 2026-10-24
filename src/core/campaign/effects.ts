import type { Effect, FlagValue, GameData, Stance } from '../defs';
import { newItem } from '../battle/create';
import { allItems } from '../rules/items';
import type { CampaignState } from '../state';
import { addToRoster } from './campaign';
import { soleKey } from './conditions';
import type { CampaignError, CampaignEvent, QueuedEffects } from './commands';

/** Effect keys whose state or rules do not exist yet; `content:check` rejects them, `applyEffects` throws. */
export const UNSUPPORTED_EFFECTS: readonly string[] = ['grudge', 'priceMod', 'villageAid', 'openQuest', 'setHome'];

const arg = (e: Effect): unknown => (e as unknown as Record<string, unknown>)[soleKey(e)];

/** `setFlag: name` sets `true`; `setFlag: { name: value }` sets that value. */
export function flagEntry(v: string | Record<string, FlagValue>): [string, FlagValue] {
  if (typeof v === 'string') return [v, true];
  const k = soleKey(v);
  return [k, v[k]!];
}

/** The queued effects of a battle as one list, in the order the dialogues fired. */
export function flattenQueued(queued: readonly QueuedEffects[] | undefined): Effect[] {
  return (queued ?? []).flatMap((q) => q.effects);
}

/** Flags the queued effects will set; conditions during the battle read them as if they were already set. */
export function queuedFlags(queued: readonly QueuedEffects[] | undefined): Record<string, FlagValue> {
  const flags: Record<string, FlagValue> = {};
  for (const e of flattenQueued(queued)) {
    if (soleKey(e) !== 'setFlag') continue;
    const [name, value] = flagEntry(arg(e) as string | Record<string, FlagValue>);
    flags[name] = value;
  }
  return flags;
}

/**
 * Checks effects against the campaign without changing anything (conditions and effects: architecture §5.3).
 * Gold and materials are summed over the whole list, so a list that ends below zero is refused as a whole.
 */
export function validateEffects(data: GameData, c: CampaignState, effects: readonly Effect[]): CampaignError | null {
  let gold = c.gold;
  const materials = { ...c.materials };
  const roster = new Set(c.roster.map((r) => r.id));
  for (const e of effects) {
    const key = soleKey(e);
    const v = arg(e);
    switch (key) {
      case 'setFlag': {
        const [name, value] = flagEntry(v as string | Record<string, FlagValue>);
        const def = data.flags[name];
        if (!def) return 'effect_invalid';
        if (def.values ? !def.values.includes(value as string | number) : value !== true) return 'effect_invalid';
        break;
      }
      case 'recruit': {
        if (typeof v !== 'string') return 'effect_unsupported';
        if (!data.chars[v]) return 'unknown_unit';
        if (c.fallen.some((f) => f.id === v)) return 'effect_invalid';
        roster.add(v);
        break;
      }
      case 'leave':
        if (!roster.has(v as string)) return 'unknown_unit';
        roster.delete(v as string);
        break;
      case 'gold':
        gold += v as number;
        if (gold < 0) return 'not_enough_gold';
        break;
      case 'material':
        for (const [id, n] of Object.entries(v as Record<string, number>)) {
          if (!data.items[id]) return 'unknown_item';
          materials[id] = (materials[id] ?? 0) + n;
          if (materials[id]! < 0) return 'not_enough_materials';
        }
        break;
      case 'item':
        if (!data.items[(v as { def: string }).def]) return 'unknown_item';
        break;
      case 'stance':
      case 'chronicle':
        break;
      default:
        return 'effect_unsupported';
    }
  }
  return null;
}

/**
 * Applies effects to `c`, which the caller has already copied. Only called from `applyCampaign` (a campaign command),
 * after `validateEffects` passed; gold and material events come from the caller's before/after comparison.
 */
export function applyEffects(data: GameData, c: CampaignState, effects: readonly Effect[], events: CampaignEvent[]): void {
  for (const e of effects) {
    const key = soleKey(e);
    const v = arg(e);
    switch (key) {
      case 'setFlag': {
        const [name, value] = flagEntry(v as string | Record<string, FlagValue>);
        if (c.flags[name] !== value) {
          c.flags[name] = value;
          events.push({ t: 'flagSet', flag: name, value });
        }
        break;
      }
      case 'recruit': {
        const id = v as string;
        c.left = c.left.filter((x) => x !== id);
        if (!c.roster.some((r) => r.id === id)) {
          addToRoster(data, c, id);
          events.push({ t: 'unitJoined', unit: id });
        }
        break;
      }
      case 'leave': {
        const id = v as string;
        const u = c.roster.find((r) => r.id === id)!;
        // what the companion carried stays with the company
        c.convoy.push(...allItems(u));
        c.roster = c.roster.filter((r) => r.id !== id);
        if (!c.left.includes(id)) c.left.push(id);
        events.push({ t: 'unitLeft', unit: id });
        break;
      }
      case 'gold':
        c.gold += v as number;
        break;
      case 'material':
        for (const [id, n] of Object.entries(v as Record<string, number>)) c.materials[id] = (c.materials[id] ?? 0) + n;
        break;
      case 'item': {
        const inst = newItem(c, v as { def: string }, data);
        c.convoy.push(inst);
        events.push({ t: 'itemGained', uid: inst.uid, def: inst.def });
        break;
      }
      case 'stance':
        c.stance[v as Stance] += 1;
        events.push({ t: 'stanceGained', stance: v as Stance });
        break;
      case 'chronicle':
        if (!c.chronicle.includes(v as string)) {
          c.chronicle.push(v as string);
          events.push({ t: 'chronicleAdded', page: v as string });
        }
        break;
      default:
        throw new Error(`effect not yet supported: ${key}`);
    }
  }
}
