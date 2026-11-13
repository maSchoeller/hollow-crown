/**
 * Lessons of the memorial hall (story 10.7): once per act the heritage of a fallen companion, mercenary or fixed stone (Gerrit) goes
 * to a living story companion as a passive skill. In the code it is `heritage` (`legacy` names the PoC save store), on screen
 * "Lektion". Which lessons a stone offers depends on the hall's level (`balance.memorial.heritageChoiceByLevel`), the lessons of a
 * role stand in `content/core/heritage.yaml`. The panel and the command `inheritHeritage` read the same functions here.
 */
import type { GameData } from '../gameData';
import type { RoomDef } from '../storyDefs';
import type { CampaignState, HeritageRecord, UnitRecord } from '../state';
import { isMercenary, openRoomLevel, roomUnlocks } from './camp';
import { memorialStones, type MemorialStone } from './memorial';

/** The unlock of the memorial room that opens the lessons (`rooms.yaml`, `unlocks`). */
const UNLOCK = 'lessons';

export type HeritageError = 'unknown_unit' | 'not_available' | 'unknown_choice';

/** The memorial room of the content (function `memorial`), if there is one. */
const memorialRoom = (data: GameData): RoomDef | undefined => Object.values(data.rooms).find((r) => r.function === 'memorial');

/** Level of the memorial hall whose lessons are open: 0 while the hall is closed or its unlock `lessons` (act 2) is not reached. */
export function heritageLevel(data: GameData, c: CampaignState): number {
  const room = memorialRoom(data);
  if (!room || !roomUnlocks(data, c, room).some((u) => u.id === UNLOCK && u.open)) return 0;
  return openRoomLevel(data, c, room.id);
}

/** The lessons passed on in the running act (`c.act`); a missed act is never caught up. */
export const heritageThisAct = (c: CampaignState): HeritageRecord[] => c.heritageGiven.filter((h) => h.act === c.act);

/** Whether the act still allows a lesson (`balance.memorial.heritagePerAct`). */
export const heritageLeft = (data: GameData, c: CampaignState): boolean => heritageThisAct(c).length < data.balance.memorial.heritagePerAct;

/** Whether the stone has passed on its lesson already (in any act). */
export const stoneGave = (c: CampaignState, key: string): boolean => c.heritageGiven.some((h) => h.from === key);

/**
 * The role a stone passes on lessons of: a fixed stone the role of its `heritage` lesson, a fallen one the role of its class.
 * Null when that role has no lessons in `heritage.yaml` (a stone without a role: tactician, captain, a class without a core role).
 */
export function stoneRole(data: GameData, stone: MemorialStone): string | null {
  if (stone.kind === 'fixed') return stone.heritage ? (Object.values(data.heritage).find((h) => h.lessons.includes(stone.heritage!))?.role ?? null) : null;
  const role = stone.classId ? data.classes[stone.classId]?.role : undefined;
  return role && data.heritage[role] ? role : null;
}

/**
 * The lessons a stone offers at the hall's level: `fixed` its fixed lesson (Gerrit: his own), `role` both of its role (Gerrit: still
 * only his own), `all` every lesson of `heritage.yaml`. Empty without a role or while the lessons are closed.
 */
export function heritageChoices(data: GameData, c: CampaignState, stone: MemorialStone): string[] {
  const level = heritageLevel(data, c);
  const role = stoneRole(data, stone);
  if (level < 1 || !role) return [];
  const modes = data.balance.memorial.heritageChoiceByLevel;
  const mode = modes[Math.min(level, modes.length) - 1]!;
  if (mode === 'all') return Object.values(data.heritage).flatMap((h) => h.lessons);
  if (stone.kind === 'fixed') return [stone.heritage!];
  const lessons = data.heritage[role]!.lessons;
  return mode === 'role' ? [...lessons] : [lessons[0]];
}

/** Who can receive a lesson: living story companions of the company (avatar and Lucan too, no mercenary) without one. */
export const heritageReceivers = (c: CampaignState): UnitRecord[] => c.roster.filter((u) => !isMercenary(u) && !u.heritage);

/** The memorial stone a lesson came from (for "Lektion · von Fenn"); undefined when that stone no longer stands. */
export function heritageStone(data: GameData, c: CampaignState, key: string): MemorialStone | undefined {
  return memorialStones(data, c).find((s) => s.key === key);
}

/**
 * Why `inheritHeritage` refuses, in the order it checks (architecture §8.1): `unknown_unit` (receiver not in the company or a
 * mercenary), `not_available` (lessons closed, this act's lesson given, stone unknown or given already, stone without a role,
 * receiver holds a lesson), `unknown_choice` (the lesson is not offered at this hall level). Null: it can be passed on.
 */
export function heritageError(data: GameData, c: CampaignState, from: string, to: string, skill: string): HeritageError | null {
  const u = c.roster.find((r) => r.id === to);
  if (!u || isMercenary(u)) return 'unknown_unit';
  if (heritageLevel(data, c) < 1 || !heritageLeft(data, c)) return 'not_available';
  const stone = heritageStone(data, c, from);
  if (!stone || stoneGave(c, from) || !stoneRole(data, stone) || u.heritage) return 'not_available';
  return heritageChoices(data, c, stone).includes(skill) ? null : 'unknown_choice';
}
