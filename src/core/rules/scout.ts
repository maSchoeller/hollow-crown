/**
 * Öffnen und Stehlen (Späher, class action `open_steal`, story 2.6). A scout opens a closed door next to it and a closed
 * chest on or next to its tile without a key and without using a charge; any other unit still needs a key (`door_key`,
 * actions `chest` and `door`). Stehlen takes one item of the player's choice out of the bag of an adjacent foe (equipped
 * gear and items tagged `convoyOnly` are safe; bosses are no exception), needs no roll, and replaces the action of the
 * turn. With the skill of the dagger Elster (`effect.stealEquipped`, story 9.10) the thief may also take what the foe has
 * equipped, with the same conditions (a scout next to a living foe, no roll); the signature items of the lieutenants and
 * `convoyOnly` goods stay safe. The item goes to the thief's bag, or to the convoy when the bag is full (`goesToConvoy`, shared with `giveItem`).
 * The UI shows only seen foes (`visibleState`), so what the preview lists is what the player may know.
 */
import type { Pos } from '../defs';
import type { GameData } from '../gameData';
import { activeSkillIds } from './skills';
import type { BattleState, BattleUnit, ItemInstance, ObjectState } from '../state';
import { active, isHostile, neighbors, samePos, unitAt } from '../util';
import { bagIsFull, isRune, itemDef } from './items';
import { classActionId } from './roles';

/** The unit is a scout of the player's side: it has Öffnen and Stehlen. */
export const isScout = (data: GameData, s: BattleState, u: BattleUnit): boolean => u.team === 'player' && classActionId(data, u, s) === 'open_steal';

/** The closed doors and chests the scout could open from `pos`: doors next to it, chests on or next to it. */
export function openTargets(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): ObjectState[] {
  if (!isScout(data, s, u)) return [];
  const near = neighbors(pos);
  return s.objects.filter(
    (o) => o.state === 'closed' && ((o.type === 'door' && near.some((p) => samePos(p, o.at))) || (o.type === 'chest' && (samePos(o.at, pos) || near.some((p) => samePos(p, o.at))))),
  );
}

/** Whether an item taken or found by `u` ends up in the convoy: its bag is full, the item is `convoyOnly` or a rune. */
export function goesToConvoy(data: GameData, u: Pick<BattleUnit, 'bag'>, item: ItemInstance): boolean {
  return bagIsFull(data, u.bag, item) || !!itemDef(data, item).tags?.includes('convoyOnly') || isRune(data, item);
}

/** The thief has a skill that lets Stehlen take equipped items (the Elster, `stealEquipped`). */
export const stealsEquipped = (data: GameData, thief: BattleUnit): boolean => activeSkillIds(data, thief).some((id) => !!data.skills[id]?.effect.stealEquipped);

/** The signature item of a lieutenant (`lieutenants.yaml`): never stolen from a hand, only dropped. */
const isLieutenantSignature = (data: GameData, i: ItemInstance): boolean => Object.values(data.lieutenants ?? {}).some((lt) => lt.signatureItem === i.def);

/**
 * What can be stolen from `target`: the items of its bag, not the `convoyOnly` ones; with `thief` holding the Elster also
 * the equipped items (after the bag, in slot order), except the signature items of lieutenants.
 */
export function stealableItems(data: GameData, target: BattleUnit, thief?: BattleUnit): ItemInstance[] {
  const out = target.bag.filter((i) => !itemDef(data, i).tags?.includes('convoyOnly'));
  if (thief && stealsEquipped(data, thief)) {
    for (const i of Object.values(target.equip)) {
      if (i && !itemDef(data, i).tags?.includes('convoyOnly') && !isLieutenantSignature(data, i)) out.push(i);
    }
  }
  return out;
}

/** Foes next to `pos` with something to steal: unit uid → uids of the items. */
export function stealTargets(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!isScout(data, s, u)) return out;
  for (const p of neighbors(pos)) {
    const o = unitAt(s, p);
    if (!o || o.uid === u.uid || !active(o) || !isHostile(o.team, u.team)) continue;
    const items = stealableItems(data, o, u);
    if (items.length) out[o.uid] = items.map((i) => i.uid);
  }
  return out;
}

/** Why the dock slot Stehlen is dimmed on `pos`: no foe next to it, or none of them carries anything to take; null when possible (or no scout). */
export function stealBlock(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): 'foe' | 'loot' | null {
  if (!isScout(data, s, u)) return null;
  if (Object.keys(stealTargets(data, s, u, pos)).length) return null;
  return neighbors(pos).some((p) => {
    const o = unitAt(s, p);
    return !!o && o.uid !== u.uid && active(o) && isHostile(o.team, u.team);
  })
    ? 'loot'
    : 'foe';
}

/** Preview of Stehlen: the items the foe's bag offers, and for each whether it would go to the convoy. */
export interface StealPreview {
  target: string;
  items: Array<{ item: ItemInstance; toConvoy: boolean; /** taken from the foe's hands (Elster) */ equipped: boolean }>;
  /** the thief may take equipped items (Elster): the screen says so */
  takesEquipped: boolean;
  /** the thief's bag is full, so everything goes to the convoy */
  bagFull: boolean;
}

export function stealPreview(data: GameData, s: BattleState, u: BattleUnit, target: string): StealPreview | null {
  const o = s.units.find((x) => x.uid === target);
  if (!o) return null;
  return {
    target,
    items: stealableItems(data, o, u).map((item) => ({ item, toConvoy: goesToConvoy(data, u, item), equipped: !o.bag.some((b) => b.uid === item.uid) })),
    takesEquipped: stealsEquipped(data, u),
    bagFull: bagIsFull(data, u.bag),
  };
}
