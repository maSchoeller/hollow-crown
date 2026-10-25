/**
 * Context bands above the unit card (story 2.7, DESIGN.md context-band): which situational actions the tile offers, in which
 * order and why. Pure: the UI only draws what comes out. Under fog the caller passes the options built on the visible state
 * (`visibleState`), so a target in the fog never shows up here.
 */
import type { GameData } from '../defs';
import type { BattleState, BattleUnit } from '../state';
import type { ActionOption } from './actions';

/** Order of the context bands: Bergen, Ansprechen, Besuchen, Öffnen, then the older ones of story 2.1. */
export const CONTEXT_ORDER = ['rescue', 'talk', 'visit', 'open', 'chest', 'door', 'seize', 'escape', 'trade', 'convoy'] as const;
export type ContextKind = (typeof CONTEXT_ORDER)[number];

/** Locale key (and its parameters) of the short reason under the title; never names the reward. */
export interface ContextReason {
  key: string;
  params?: Record<string, number>;
}

/** One band: one action on one target (a downed ally, a recruitable foe, a door or chest) or on the tile. */
export interface ContextEntry {
  /** stable within a unit and tile, used for keys and to restore the front band */
  id: string;
  kind: ContextKind;
  /** the option narrowed to this target, ready for `doAction` */
  option: ActionOption;
  /** unit the band shows as mini portrait; objects show their symbol instead */
  target?: string;
  reason?: ContextReason;
}

const rank = (k: string): number => CONTEXT_ORDER.indexOf(k as ContextKind);

/** Own phases the downed unit still has before it bleeds out (at least 1 while it is downed). */
export const bleedLeft = (data: GameData, u: Pick<BattleUnit, 'bleed'>): number => Math.max(1, data.balance.death.bleedOutTurns - (u.bleed ?? 0));

/** The bands for `options` (from `availableActions`), most urgent first; empty when nothing but the dock applies. */
export function contextEntries(data: GameData, s: BattleState, options: ActionOption[]): ContextEntry[] {
  const unitOf = (uid: string) => s.units.find((u) => u.uid === uid);
  const out: Array<ContextEntry & { urgency: number }> = [];
  for (const o of options) {
    if (rank(o.kind) < 0) continue;
    const kind = o.kind as ContextKind;
    switch (kind) {
      case 'rescue':
        // one band per downed ally; the one closest to bleeding out first
        for (const uid of o.targets ?? []) {
          const u = unitOf(uid);
          if (!u) continue;
          const n = bleedLeft(data, u);
          out.push({ id: `rescue:${uid}`, kind, option: { ...o, targets: [uid] }, target: uid, reason: { key: n === 1 ? 'ui.ctx.rescueSub1' : 'ui.ctx.rescueSub', params: { n } }, urgency: n });
        }
        break;
      case 'talk':
        for (const uid of o.targets ?? []) {
          if (unitOf(uid)) out.push({ id: `talk:${uid}`, kind, option: { ...o, targets: [uid] }, target: uid, reason: { key: 'ui.ctx.talkSub' }, urgency: 0 });
        }
        break;
      case 'visit':
        out.push({ id: `visit:${o.object ?? ''}`, kind, option: o, reason: { key: 'ui.ctx.visitSub' }, urgency: 0 });
        break;
      case 'open':
        // the scout needs no key
        out.push({ id: `open:${o.object ?? ''}`, kind, option: o, reason: { key: `ui.ctx.open.${o.objectType ?? 'chest'}Sub` }, urgency: 0 });
        break;
      case 'chest':
      case 'door':
        out.push({ id: `${kind}:${o.object ?? ''}`, kind, option: o, reason: { key: `ui.ctx.${kind}Sub` }, urgency: 0 });
        break;
      case 'trade':
        // one band; with several partners the target is picked on the board
        out.push({ id: 'trade', kind, option: o, target: o.targets?.length === 1 ? o.targets[0] : undefined, urgency: 0 });
        break;
      default:
        out.push({ id: kind, kind, option: o, urgency: 0 });
    }
  }
  const seq = new Map(out.map((e, i) => [e.id, i]));
  out.sort((a, b) => rank(a.kind) - rank(b.kind) || a.urgency - b.urgency || seq.get(a.id)! - seq.get(b.id)!);
  return out.map(({ urgency: _u, ...e }) => e);
}
