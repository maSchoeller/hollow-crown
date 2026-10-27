import type { Effect, ItemRef } from '../defs';
import { soleKey } from './conditions';

/**
 * One line of the consequence card (concept/25-ux/DESIGN.md `consequence-card`): what an answer did, for the player.
 * The UI picks icon and texts by `kind` (`ui.consequence.<kind>.*`); amounts are shown as symbol + number.
 */
export type ConsequenceLine =
  | { kind: 'recruit' | 'leave'; unit: string }
  | { kind: 'gold'; amount: number }
  | { kind: 'material'; id: string; amount: number }
  /** `amount`: how many of this item came at once (repeated `item` effects of the same item are one line); absent for a single one */
  | { kind: 'item'; def: string; amount?: number }
  | { kind: 'chronicle'; page: string }
  | { kind: 'quest'; node: string }
  | { kind: 'grudge'; lt: string; delta: number }
  | { kind: 'priceMod'; pct: number; act: number }
  | { kind: 'villageAid'; act: number }
  | { kind: 'home'; home: string }
  /** the decision itself is written into the chronicle (always the last line) */
  | { kind: 'noted' };

/**
 * The lines of the consequence card for the effects of an answer, in their order, then `noted`. Flags and stance
 * points are the story's bookkeeping and have no line of their own. Pure.
 */
export function consequenceLines(effects: readonly Effect[]): ConsequenceLine[] {
  const out: ConsequenceLine[] = [];
  for (const e of effects) {
    const key = soleKey(e);
    const v = (e as unknown as Record<string, unknown>)[key];
    switch (key) {
      case 'recruit':
        if (typeof v === 'string') out.push({ kind: 'recruit', unit: v });
        else out.push({ kind: 'recruit', unit: (v as { lt: string }).lt });
        break;
      case 'leave':
        out.push({ kind: 'leave', unit: v as string });
        break;
      case 'gold':
        out.push({ kind: 'gold', amount: v as number });
        break;
      case 'material':
        for (const [id, n] of Object.entries(v as Record<string, number>)) out.push({ kind: 'material', id, amount: n });
        break;
      case 'item': {
        const def = (v as ItemRef).def;
        const last = out[out.length - 1];
        if (last?.kind === 'item' && last.def === def) last.amount = (last.amount ?? 1) + 1;
        else out.push({ kind: 'item', def });
        break;
      }
      case 'chronicle':
        out.push({ kind: 'chronicle', page: v as string });
        break;
      case 'openQuest':
        out.push({ kind: 'quest', node: v as string });
        break;
      case 'grudge': {
        const g = v as { lt: string; delta: number };
        out.push({ kind: 'grudge', lt: g.lt, delta: g.delta });
        break;
      }
      case 'priceMod': {
        const p = v as { pct: number; act: number };
        out.push({ kind: 'priceMod', pct: p.pct, act: p.act });
        break;
      }
      case 'villageAid':
        out.push({ kind: 'villageAid', act: (v as { act: number }).act });
        break;
      case 'setHome':
        out.push({ kind: 'home', home: v as string });
        break;
    }
  }
  out.push({ kind: 'noted' });
  return out;
}
