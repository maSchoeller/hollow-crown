/**
 * Fix 2026-11-13 (report from 1-7 and 1-8): units stood on mountain. Two causes: a unit spawned on a taken field (reinforcement,
 * trigger spawn, recruit from a reward) went to the nearest free tile of any terrain but wall; `freeTileNear` now only takes a tile
 * the unit can stand on, reached across tiles it could walk between. And the rock of the vault 1-7 was `mountain`, which scouts
 * (`climber`) and fliers may enter; it is `cave_rock` now, closed to everyone.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  autoCommand,
  beginBattle,
  computeStats,
  freeTileNear,
  levelsLink,
  moveCost,
  neighbors,
  parseLevels,
  parseTerrain,
  posKey,
  type BattleState,
  type BattleUnit,
  type GameData,
  type MapUnitDef,
  type Pos,
} from '../../src/core';
import { campaignAt } from '../../tools/simMap';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

/** Every unit a map can bring onto the board after its start: reinforcements and trigger spawns, plus its line-up. */
const spawnDefs = (mapId: string): MapUnitDef[] => {
  const m = data.maps[mapId]!;
  return [...m.units, ...m.reinforcements.flatMap((r) => r.units), ...m.triggers.flatMap((t) => t.then.flatMap((a) => (a.action === 'spawn' ? a.units : [])))];
};

/** A bare board of `mapId` with a unit on each of `taken`: enough for the placement rules. */
function board(mapId: string, taken: Pos[]): BattleState {
  const m = data.maps[mapId]!;
  const units = taken.map((pos, i) => ({ uid: `x${i}`, pos, hp: 1 }) as unknown as BattleUnit);
  return { mapId, width: m.size[0], height: m.size[1], terrain: parseTerrain(data, mapId), levels: parseLevels(m), units } as unknown as BattleState;
}

/** Units standing on a tile they cannot enter (move type and skills such as `climber`), or on mountain under a roof. */
const stranded = (s: BattleState) =>
  s.units
    .filter((u) => {
      if (!u.pos || u.gone) return false;
      if (data.maps[s.mapId]!.interior && s.terrain[u.pos[1] * s.width + u.pos[0]] === 'mountain') return true;
      return moveCost(data, s, u, u.pos, computeStats(data, u, { state: s, pos: u.pos }).skills.terrainCost) === null;
    })
    .map((u) => `${u.uid}@${u.pos}`);

describe('freeTileNear', () => {
  it('never puts a spawn whose field is taken on terrain its move type cannot enter, on any map', () => {
    const wrong: string[] = [];
    for (const mapId of Object.keys(data.maps)) {
      for (const def of spawnDefs(mapId)) {
        const mt = data.classes[def.class]!.moveType;
        // the field and its passable ring taken: the search has to go a step further
        const s0 = board(mapId, []);
        const ring = neighbors(def.at).filter((n) => n[0] >= 0 && n[1] >= 0 && n[0] < s0.width && n[1] < s0.height);
        const s = board(mapId, [def.at, ...ring.filter((n) => levelsLink(data, s0, def.at, n, mt))]);
        const at = freeTileNear(data, s, def.at, mt);
        if (!at) continue;
        const id = s.terrain[at[1] * s.width + at[0]]!;
        if (data.terrain[id]!.cost[mt] == null) wrong.push(`${mapId} ${def.id ?? def.class}@${def.at} → ${posKey(at)} ${id}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('takes the field itself when it is free, and does not cross a mountain ridge to a free tile behind it', () => {
    // 1-7 row 5 is "^^^^^^^..^^^^^^^": with the corridor [7..8, 4..6] taken, the next free tile lies along the corridor, never in the rock beside it
    const s = board('m1_7_gewoelbe', [
      [7, 5],
      [8, 5],
      [7, 4],
      [8, 4],
      [7, 6],
      [8, 6],
    ]);
    expect(freeTileNear(data, board('m1_7_gewoelbe', []), [7, 5], 'foot')).toEqual([7, 5]);
    const at = freeTileNear(data, s, [7, 5], 'foot')!;
    expect(data.terrain[s.terrain[at[1] * s.width + at[0]]!]!.cost.foot).not.toBeNull();
  });
});

describe('no unit on impassable terrain during a battle', () => {
  // 1-7 seed 1: before the fix the scout Fenn climbed into the rock beside the corridor (6,5) and an enemy stood at 6,6;
  // 1-8 seed 1: a reinforcement whose road tile was taken landed on the mountain at 6,0
  it.each([
    ['m1_7', 1],
    ['m1_8', 1],
  ])('%s seed %i, after every command of an autoplay run', (nodeId, seed) => {
    const c = campaignAt(data, seed, nodeId, 'normal', 'standard');
    let s = beginBattle(data, c, nodeId, c.roster.map((u) => u.id)).state;
    const seen: string[] = [...stranded(s)];
    for (let i = 0; i < 2000 && !s.outcome; i++) {
      s = applyCommand(data, s, autoCommand(data, s)).state;
      seen.push(...stranded(s).map((x) => `turn ${s.turn}: ${x}`));
    }
    expect(seen).toEqual([]);
  }, 60_000);
});
