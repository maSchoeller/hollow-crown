/**
 * Story 16.16: what the enchanter's workbench works out, apart from drawing (no DOM, no Babylon): whose pieces it shows, which
 * setting is the large and which the small one, the probe (the piece with the chosen stone in the chosen setting), why a stone does not
 * fit and what the main button does. Every check is the one `applyCampaign` makes (`runeSetError`, `buyRuneError`); the numbers of the
 * change list come from `changeList`.
 */
import {
  buyRuneError,
  itemDef,
  locateItem,
  runeOffers,
  runeSetError,
  runeSlotCount,
  runeSlots,
  type CampaignCommand,
  type CampaignState,
  type GameData,
  type ItemInstance,
  type RuneSetError,
} from '../../core';
import { BAR_CONVOY } from './PersonBar';

/** The pieces of a person with at least one rune setting (worn, then the bag); of the convoy: the convoy's pieces. */
export function enchantables(data: GameData, c: CampaignState, person: string): ItemInstance[] {
  const list =
    person === BAR_CONVOY
      ? c.convoy
      : (() => {
          const u = c.roster.find((r) => r.id === person);
          return u ? [...Object.values(u.equip), ...u.bag].filter((i): i is ItemInstance => !!i) : [];
        })();
  return list.filter((i) => runeSlotCount(data, i) > 0);
}

/** Who holds a piece for the person bar: the unit's id, or the convoy medallion. */
export function personOf(c: CampaignState, uid: string): string | null {
  const loc = locateItem(c, uid);
  if (!loc) return null;
  return loc.owner ? loc.owner.id : c.convoy.some((i) => i.uid === uid) ? BAR_CONVOY : null;
}

/** The setting a gem stands for: the large one holds the element rune (else place 0), the small one is the other place. */
export function gemIndex(data: GameData, inst: ItemInstance, key: 'main' | 'small'): number | null {
  const runes = runeSlots(data, inst);
  if (runes.length < 2) return key === 'main' ? 0 : null;
  const el = runes.findIndex((r) => !!r && !!data.runes[r]?.element && !data.runes[r]?.utility);
  const main = el >= 0 ? el : 0;
  return key === 'main' ? main : main === 0 ? 1 : 0;
}

/** The piece with `runeId` sitting in setting `index`: what the probe shows. */
export function probeOf(data: GameData, inst: ItemInstance, runeId: string, index: number): ItemInstance {
  const runes = runeSlots(data, inst);
  runes[index] = runeId;
  return { ...inst, runes };
}

/** The key of the sentence that says why a stone does not go into a setting (`ui.enchanter.why.*`); null: it fits. */
export function stoneWhy(data: GameData, inst: ItemInstance, runeId: string, index: number): string | null {
  const err: RuneSetError | null = runeSetError(data, inst, runeId, index);
  if (!err) return null;
  if (err === 'wrong_item') {
    const d = itemDef(data, inst);
    return d.kind === 'shield' ? (data.runes[runeId]?.element ? 'shieldElement' : 'shield') : 'body';
  }
  return err;
}

/** What the player chose from the vault: a stone of the convoy, or a rune I the enchanter sells. */
export type StoneChoice = { kind: 'stone'; id: string } | { kind: 'offer'; id: string };

/** The main button: what it does (`kind`), the command it sends, the price of a purchase and why it is dimmed (`why`: a `ui.enchanter.why.*` or `ui.camp.err.*` key). */
export interface MainAction {
  kind: 'insert' | 'swap' | 'buy' | 'remove' | 'none';
  cmd?: CampaignCommand;
  price?: number;
  why?: string;
}

export function mainAction(data: GameData, c: CampaignState, inst: ItemInstance, index: number, choice: StoneChoice | null): MainAction {
  const taken = !!runeSlots(data, inst)[index];
  if (!choice) return taken ? { kind: 'remove', cmd: { type: 'removeRune', item: inst.uid, index } } : { kind: 'none' };
  const why = stoneWhy(data, inst, choice.id, index);
  if (choice.kind === 'stone') {
    const stone = c.convoy.find((i) => i.def === choice.id);
    if (!stone) return { kind: 'none', why: 'missing' };
    if (why) return { kind: 'none', why };
    return { kind: taken ? 'swap' : 'insert', cmd: { type: 'insertRune', item: inst.uid, rune: stone.uid, index } };
  }
  const price = runeOffers(data, c).find((o) => o.id === choice.id)?.price;
  if (why) return { kind: 'none', why, ...(price !== undefined ? { price } : {}) };
  const err = buyRuneError(data, c, choice.id, inst, index);
  return { kind: 'buy', price, cmd: { type: 'buyRune', rune: choice.id, item: inst.uid, index }, ...(err ? { why: err === 'convoy_full' ? 'convoyFull' : err === 'not_enough_gold' ? 'gold' : err } : {}) };
}
