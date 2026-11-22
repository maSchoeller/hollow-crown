import type { GameData } from '../gameData';
import type { GameEvent } from '../events';
import type { BattleUnit, Epithet, ItemInstance } from '../state';
import { hash32 } from '../rng';
import { itemDef } from './items';

/** Key of the word list of a weapon: its weapon type; undefined when the weapon keeps no chronicle (siege, breath, tools). */
export function chronicleKey(data: GameData, inst: ItemInstance): string | undefined {
  const d = itemDef(data, inst);
  if (d.tags?.includes('fixed') || d.tags?.includes('monsterOnly')) return undefined;
  const key = d.weaponType;
  return key && data.balance.weaponChronicle.words[key] ? key : undefined;
}

const uidHash = (uid: string): number => [...uid].reduce((h, ch) => hash32(h, ch.charCodeAt(0)), 0);

/** The unit with the most kills on this weapon; `last` wins a tie (it struck the blow that decides). */
function leader(inst: ItemInstance, last: string): string {
  let best = last;
  let n = inst.killsBy?.[last] ?? 0;
  for (const [id, k] of Object.entries(inst.killsBy ?? {})) {
    if (k > n) {
      best = id;
      n = k;
    }
  }
  return best;
}

/**
 * A weapon of the company felled `foe` (story 16.5): counts the kill on the instance in the slot and earns the epithet at the
 * threshold, or at once for a lieutenant. No RNG: the word is picked by a hash of the weapon's uid.
 */
export function recordKill(data: GameData, me: BattleUnit, foe: BattleUnit, inst: ItemInstance, events: GameEvent[]): void {
  const key = chronicleKey(data, inst);
  if (!key) return;
  const cfg = data.balance.weaponChronicle;
  inst.kills = (inst.kills ?? 0) + 1;
  inst.killsBy = { ...inst.killsBy, [me.id]: (inst.killsBy?.[me.id] ?? 0) + 1 };
  let epithet: Epithet | undefined;
  if (!inst.epithet) {
    if (foe.lieutenant) epithet = { kind: 'lieutenant', lt: foe.lieutenant };
    else if (inst.kills >= cfg.epithetKills) epithet = { kind: 'holder', by: leader(inst, me.id), word: uidHash(inst.uid) % cfg.words[key]! };
    if (epithet) inst.epithet = epithet;
  }
  events.push({ t: 'chronicle', unit: me.uid, uid: inst.uid, kills: inst.kills, ...(epithet ? { epithet } : {}) });
}

/**
 * Text of an epithet from the locale (no DOM, no fixed words): `t` translates a key, `nameOf` gives the display name of a unit id
 * or lieutenant id (`unit.<id>.name`). Names ending on a character of `chronicle.sibilants` take `holderS`.
 */
export function epithetText(
  t: (key: string, params?: Record<string, string | number>) => string,
  nameOf: (id: string) => string,
  epithet: Epithet,
  weaponKey: string,
): string {
  if (epithet.kind === 'lieutenant') return t('chronicle.epithet.lieutenant', { lt: nameOf(epithet.lt) });
  const name = nameOf(epithet.by);
  const word = t(`chronicle.word.${weaponKey}.${epithet.word}`);
  const last = name.slice(-1).toLowerCase();
  const sib = t('chronicle.sibilants');
  const sibilant = last !== '' && sib !== 'chronicle.sibilants' && sib.includes(last);
  return t(sibilant ? 'chronicle.epithet.holderS' : 'chronicle.epithet.holder', { name, word });
}
