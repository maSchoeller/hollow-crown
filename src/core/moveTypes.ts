import type { MoveType } from './defs';
import type { GameData } from './gameData';

/**
 * Move types a unit of the company can have: the classes of the story characters, everything they promote into and the player
 * units the maps place. A deploy slot has to be open to all of them, since the slots are one list for the whole company
 * (`content:check` for the maps, `buildHauntMap` for the boards of the haunts).
 */
export function companyMoveTypes(data: Pick<GameData, 'chars' | 'classes' | 'maps'>): MoveType[] {
  const seen = new Set<string>();
  const out = new Set<MoveType>();
  const walkClass = (classId: string) => {
    if (seen.has(classId)) return;
    seen.add(classId);
    const cls = data.classes[classId];
    if (!cls) return;
    out.add(cls.moveType);
    for (const next of cls.proPaths ?? []) if (data.classes[next]?.playable) walkClass(next);
  };
  for (const ch of Object.values(data.chars)) walkClass(ch.class);
  for (const m of Object.values(data.maps)) for (const u of m.units) if (u.team === 'player') walkClass(u.class);
  return [...out];
}
