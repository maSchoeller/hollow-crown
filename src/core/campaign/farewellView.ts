import type { GameData } from '../defs';
import type { BattleResult } from './campaign';
import { lineKey } from './scene';

/** Scene holding a companion's last line (`last`) and the grief line of each support partner (`grief_<partner>`). */
export const farewellScene = (charId: string): string => `scn.farewell.${charId}`;

export interface FarewellGrief {
  id: string;
  /** missions the grief penalty lasts */
  missions: number;
  /** hit lost while grieving */
  hitPenalty: number;
  /** the partner's grief line from the farewell scene, if written */
  lineKey?: string;
}

/** One farewell card after the result (story 6.7, mockup 08); the screen only lays it out. */
export interface FarewellCard {
  id: string;
  nameKey: string;
  name?: string;
  portrait?: string;
  classId?: string;
  /** node the figure fell in (its title names the place) */
  nodeId: string;
  /** short form for tavern mercenaries: no last line, no grief */
  mercenary: boolean;
  /** last line from the companion's farewell scene; missing → the screen uses the general line */
  lastKey?: string;
  grief: FarewellGrief[];
}

export const hasLine = (data: GameData, scene: string, line: string): boolean =>
  !!data.scenes[scene]?.lines.some((l) => l.id === line && 'text' in l);

/** Farewell cards for everyone who fell in a won mission, in the order they are listed in the result. */
export function farewellView(data: GameData, result: BattleResult): FarewellCard[] {
  if (result.outcome !== 'victory') return [];
  const penalty = data.balance.supports.griefHitPenalty;
  return result.fallen.map((f) => {
    const mercenary = !!f.mercenary;
    const scene = farewellScene(f.id);
    return {
      id: f.id,
      nameKey: f.nameKey,
      name: f.name,
      portrait: f.portrait,
      classId: f.classId,
      nodeId: result.nodeId,
      mercenary,
      lastKey: !mercenary && hasLine(data, scene, 'last') ? lineKey(scene, 'last') : undefined,
      grief: mercenary
        ? []
        : (f.grief ?? []).map((g) => ({
            id: g.id,
            missions: g.missions,
            hitPenalty: penalty,
            lineKey: hasLine(data, scene, `grief_${g.id}`) ? lineKey(scene, `grief_${g.id}`) : undefined,
          })),
    };
  });
}
