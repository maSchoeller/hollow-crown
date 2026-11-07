/**
 * Balliste (story 11.6, GDD Gelände): the primitives the movement rules need as well (danger zone), so they stay free of the
 * combat code. A ballista is a map object on an impassable tile; a unit on a neighbouring tile fires its fixed weapon
 * (`balance.ballista.item`) instead of its action. Targets, preview and resolution are in `ballista.ts`.
 */
import type { GameData } from '../gameData';
import type { BattleState, BattleUnit, ItemInstance, ObjectState } from '../state';

/** The ballistas of the battle (none on any map of act 1). */
export function ballistasOf(s: Pick<BattleState, 'objects'>): ObjectState[] {
  return s.objects.filter((o) => o.type === 'ballista');
}

/** A ballista fires once per phase: its object stands on `open` until the next phase begins. */
export const ballistaReady = (o: ObjectState): boolean => o.state !== 'open';

/** Whether the unit may work a ballista: its move type is one of `balance.ballista.crew` (no riders, no fliers, no monsters). */
export function canCrew(data: GameData, u: Pick<BattleUnit, 'classId'>): boolean {
  const mt = data.classes[u.classId]?.moveType;
  return !!mt && data.balance.ballista.crew.includes(mt);
}

/** Range of the fixed weapon, from the item. */
export function ballistaRange(data: GameData): [number, number] {
  return data.items[data.balance.ballista.item]?.rng ?? [1, 1];
}

/** Prefix of the uid of a ballista's synthetic weapon. */
export const BALLISTA_PREFIX = 'ballista:';

/** The synthetic weapon of one ballista (`ballista:<objectId>`): never carried, it only feeds `forecast` and `resolveAttack`. */
export function ballistaWeapon(data: GameData, objectId: string): ItemInstance {
  return { uid: `${BALLISTA_PREFIX}${objectId}`, def: data.balance.ballista.item, upgrade: 0, affixes: [], runes: [] };
}

/**
 * Whether a foe with this AI profile fires a ballista at all (story 11.6, Epic/GDD: a foe beside it uses it): every waking profile
 * but `flee`; a `trigger` foe is asleep while it has that profile (waking gives it its `then` profile).
 */
export const firesBallista = (profile: string): boolean => profile !== 'flee' && profile !== 'trigger';
