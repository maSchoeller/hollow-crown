import type { GameData } from '../defs';
import type { BattleState, ItemInstance } from '../state';
import { findUnit } from '../util';
import type { BattleResult, BountyResult } from './campaign';

/** One figure of the company in the result: survivors with their EP and level, the fallen grey (mockup 08). */
export interface ResultFigure {
  id: string;
  nameKey: string;
  name?: string;
  portrait?: string;
  classId?: string;
  fallen: boolean;
  exp: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
}

/** What the result screen draws after a won mission; the screen only lays it out (story 6.6). */
export interface MissionResultView {
  nodeId: string;
  turns: number;
  gold: number;
  materials: Array<{ id: string; count: number }>;
  items: ItemInstance[];
  /** driven-off lieutenants; the section is hidden while this is empty */
  bounty: BountyResult[];
  side: BattleResult['side'];
  /** survivors in company order, then the fallen */
  figures: ResultFigure[];
  recruited: string[];
  granted: BattleResult['granted'];
  scars: BattleResult['scars'];
  supportsReady: boolean;
}

export function missionResultView(result: BattleResult): MissionResultView {
  const alive: ResultFigure[] = result.units.map((u) => ({
    id: u.id,
    nameKey: u.nameKey,
    name: u.name,
    portrait: u.portrait,
    classId: u.classId,
    fallen: false,
    exp: u.exp,
    levelBefore: u.levelBefore,
    levelAfter: u.levelAfter,
    leveledUp: u.levelAfter > u.levelBefore,
  }));
  const fallen: ResultFigure[] = result.fallen.map((f) => ({
    id: f.id,
    nameKey: f.nameKey,
    name: f.name,
    portrait: f.portrait,
    classId: f.classId,
    fallen: true,
    exp: 0,
    levelBefore: 0,
    levelAfter: 0,
    leveledUp: false,
  }));
  return {
    nodeId: result.nodeId,
    turns: result.turns,
    gold: result.gold,
    materials: Object.entries(result.materials)
      .filter(([, n]) => n > 0)
      .map(([id, count]) => ({ id, count })),
    items: result.items,
    bounty: result.bounty ?? [],
    side: result.side,
    figures: [...alive, ...fallen],
    recruited: result.recruited,
    granted: result.granted ?? [],
    scars: result.scars,
    supportsReady: result.supportsReady.length > 0,
  };
}

/** The one-sentence reason of a defeat: which sentence, and what fills its blanks. */
export type DefeatSentence =
  | { kind: 'turns'; turns: number }
  | { kind: 'unit'; nameKey: string; name?: string }
  | { kind: 'generic' };

export function defeatSentence(data: GameData, s: BattleState): DefeatSentence {
  const reason = s.defeatReason;
  if (reason === 'turns') {
    const limit = data.maps[s.mapId]?.objectives.defeat.find((d) => d.type === 'turn_limit');
    return limit && limit.type === 'turn_limit' ? { kind: 'turns', turns: limit.turns } : { kind: 'generic' };
  }
  const u = reason ? findUnit(s, reason) : undefined;
  return u ? { kind: 'unit', nameKey: u.nameKey, name: u.name } : { kind: 'generic' };
}
