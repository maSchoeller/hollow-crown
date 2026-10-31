import type { GameData } from '../gameData';
import type { UnitRecord } from '../state';

/**
 * Id of the unit's class action (`aim`, `far_rescue`, `inspire`, `hold`, `pursue`, ...), if its class has one. With a battle
 * state, a role no companion has brought along yet (`lockedRoles`, story 4.3) has none.
 */
export function classActionId(data: GameData, u: Pick<UnitRecord, 'classId'>, s?: { lockedRoles?: string[] }): string | undefined {
  const cls = data.classes[u.classId];
  if (cls && s?.lockedRoles?.includes(cls.role)) return undefined;
  return cls?.classAction?.id;
}
