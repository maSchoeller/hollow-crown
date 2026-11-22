/**
 * Story 16.18: the armoury in the keep. A mirror of what the company holds, never a store: every relic and signature
 * weapon in the roster's gear or the convoy stands on a stand (worn ones too), the rest stand empty (a hidden relic, a
 * lieutenant's signature within reach). Nothing is kept in the save. Pure: no Babylon, no DOM, no randomness.
 */
import type { GameData } from '../gameData';
import type { CampaignState } from '../state';
import { allItems } from '../rules/items';
import { isJoined, lieutenantState } from './lieutenants';

/** Tag of a lieutenant's or companion's signature weapon in `items.yaml` (relics carry `relic` or `stages`). */
export const SIGNATURE_TAG = 'signature';

export type ArmoryStand =
  /** a piece the company owns; `wearer`: the unit whose gear it is (equipped or in the bag), missing in the convoy */
  | { kind: 'owned'; uid: string; def: string; relic: boolean; wearer?: string }
  /** a relic the company does not hold yet: "still hidden" */
  | { kind: 'hidden'; def: string }
  /** a signature within reach: lieutenant `lieutenant` met, not joined, signature not fallen yet; `routs` of `max` */
  | { kind: 'reach'; def: string; lieutenant: string; routs: number; max: number };

const isRelicDef = (d: { stages?: unknown; tags?: string[] }): boolean => !!d.stages || !!d.tags?.includes('relic');
const isSignatureDef = (d: { tags?: string[] }): boolean => !!d.tags?.includes(SIGNATURE_TAG);

/** The stands of the armoury: owned (relics before signatures, then the order of `data.items`), then the empty ones. */
export function armoryOf(data: GameData, c: CampaignState): { pieces: ArmoryStand[] } {
  const order = Object.keys(data.items);
  const rank = (def: string): number => order.indexOf(def);
  const owned: Array<Extract<ArmoryStand, { kind: 'owned' }>> = [];
  const add = (inst: { uid: string; def: string }, wearer?: string): void => {
    const d = data.items[inst.def];
    if (!d) return;
    const relic = isRelicDef(d);
    if (!relic && !isSignatureDef(d)) return;
    owned.push({ kind: 'owned', uid: inst.uid, def: inst.def, relic, ...(wearer ? { wearer } : {}) });
  };
  for (const i of c.convoy) add(i);
  for (const u of c.roster) for (const i of allItems(u)) add(i, u.id);
  // stable sort: relics first, then the item order; pieces of one def keep their discovery order
  owned.sort((a, b) => Number(b.relic) - Number(a.relic) || rank(a.def) - rank(b.def));
  const held = new Set(owned.map((p) => p.def));
  const empty: ArmoryStand[] = [];
  for (const id of order) {
    const d = data.items[id]!;
    if (isRelicDef(d) && !held.has(id)) empty.push({ kind: 'hidden', def: id });
  }
  const max = data.balance.lieutenant.signature.guaranteedRout;
  for (const lt of Object.values(data.lieutenants ?? {})) {
    const st = lieutenantState(c, lt.id);
    // [ASSUMPTION A2] only lieutenants met, not joined, whose signature has not fallen and is not held
    if (!st.met || st.signatureDropped || isJoined(c, lt.id) || held.has(lt.signatureItem) || !data.items[lt.signatureItem]) continue;
    empty.push({ kind: 'reach', def: lt.signatureItem, lieutenant: lt.id, routs: Math.min(st.routs, max), max });
  }
  return { pieces: [...owned, ...empty] };
}

/** The number of pieces the company owns (the head pill counts only these, never the empty stands). */
export const armoryCount = (data: GameData, c: CampaignState): number => armoryOf(data, c).pieces.filter((p) => p.kind === 'owned').length;

/** Whether the armoury shows at all: the castle and at least one piece owned. */
export const armoryOpen = (data: GameData, c: CampaignState): boolean => c.home.kind === 'castle' && armoryCount(data, c) > 0;
