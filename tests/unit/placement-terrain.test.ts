/**
 * QA Akt 2 (2026-11-13): the invariant of the fix from 2026-11-13 (`spawn-terrain.test.ts`: a unit never stands on terrain its
 * move type cannot enter) over the ways a unit comes onto a field that `content:check` cannot see, because they are decided while
 * the battle runs: the boards of the haunts (deploy slots and foes are picked from the anchor at run time), the knockback, and
 * every map of act 2 through a whole autoplay run. The fields a map names itself (line-up, reinforcements, trigger spawns, deploy
 * slots) are checked by `validateMap` for every map of every act.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { companyMoveTypes } from '../../src/content/validateWalk';
import {
  applyCommand,
  autoCommand,
  beginBattle,
  buildHauntMap,
  computeStats,
  hauntUnitDefs,
  knockbackTarget,
  makeHaunt,
  moveCost,
  parseLevels,
  parseTerrain,
  posKey,
  seedRng,
  type BattleState,
  type BattleUnit,
  type GameData,
  type MapDef,
  type MoveType,
  type Pos,
} from '../../src/core';
import { campaignAt } from '../../tools/simMap';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

/** A bare board of a map: enough for the terrain and level rules. */
const board = (map: MapDef): BattleState =>
  ({ mapId: map.id, width: map.size[0], height: map.size[1], terrain: parseTerrain(data, map.id), levels: parseLevels(map), units: [] }) as unknown as BattleState;

const terrainOf = (s: BattleState, p: Pos) => s.terrain[p[1] * s.width + p[0]]!;
const enterable = (id: string, mt: string) => data.terrain[id]?.cost[mt as MoveType] != null;
const inside = (s: BattleState, p: Pos) => p[0] >= 0 && p[1] >= 0 && p[0] < s.width && p[1] < s.height;
/** The maps the content brings; a board derived for a haunt (`hauntMapId`, with '~' in its id) is left out. */
const storyMaps = () => Object.values(data.maps).filter((m) => !m.id.includes('~'));

describe('haunt boards', () => {
  /** Every anchor of every map, once per lieutenant who could lead it. */
  const anchors = () => storyMaps().flatMap((map) => (map.haunts ?? []).flatMap((a) => Object.values(data.lieutenants ?? {}).map((lt) => ({ map, variant: a.variant, lt: lt.id }))));

  it('leaves no deploy slot on terrain a companion cannot stand on', () => {
    const mts = companyMoveTypes(data);
    const wrong: string[] = [];
    for (const { map, variant, lt } of anchors()) {
      const h = buildHauntMap(data, map.id, variant, lt);
      if (!h) continue;
      const s = board(map);
      for (const slot of h.deploy.slots) for (const mt of mts) if (!enterable(terrainOf(s, slot), mt)) wrong.push(`${map.id}:${variant} slot ${posKey(slot)} ${terrainOf(s, slot)} is closed to ${mt}`);
    }
    expect([...new Set(wrong)]).toEqual([]);
  });

  it('puts its foes, its civilian and its lieutenant on terrain they may enter', () => {
    const wrong: string[] = [];
    for (const { map, variant, lt } of anchors()) {
      const base = data.maps[map.id]!;
      const anchor = base.haunts!.find((a) => a.variant === variant)!;
      const def = data.lieutenants![lt]!;
      const last = data.acts[def.act]?.nodes.filter((n) => n.kind === 'story').at(-1);
      if (!last) continue;
      const c = campaignAt(data, 1, last.id, 'normal', 'standard');
      c.act = def.act;
      const h = makeHaunt(data, c, base, anchor, def, 'qa', 1, seedRng(7));
      if (!h) continue;
      const s = board(map);
      for (const u of hauntUnitDefs(data, h, base)) {
        const mt = data.classes[u.class]!.moveType;
        if (!inside(s, u.at) || !enterable(terrainOf(s, u.at), mt)) wrong.push(`${map.id}:${variant} ${u.id ?? u.class}@${posKey(u.at)} ${terrainOf(s, u.at)} is closed to ${mt}`);
      }
    }
    expect([...new Set(wrong)]).toEqual([]);
  });
});

describe('knockback', () => {
  it('never pushes a unit onto terrain its move type cannot enter, on any map', () => {
    const wrong: string[] = [];
    for (const map of storyMaps()) {
      const s = board(map);
      for (const mt of companyMoveTypes(data)) {
        const classId = Object.values(data.classes).find((c) => c.moveType === mt)!.id;
        for (let y = 0; y < s.height; y++)
          for (let x = 0; x < s.width; x++) {
            const at: Pos = [x, y];
            if (!enterable(terrainOf(s, at), mt)) continue;
            const unit = { uid: 'k', classId, team: 'player', hp: 10, pos: at } as unknown as BattleUnit;
            for (const from of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]] as Pos[]) {
              const { to, blocked } = knockbackTarget(data, { ...s, units: [unit] } as BattleState, from, unit, at);
              if (blocked) continue;
              if (!inside(s, to) || !enterable(terrainOf(s, to), mt)) wrong.push(`${map.id} ${mt} ${posKey(at)} → ${posKey(to)} ${inside(s, to) ? terrainOf(s, to) : 'off the board'}`);
            }
          }
      }
    }
    expect([...new Set(wrong)]).toEqual([]);
  });
});

/** Units standing on a tile they cannot enter (move type and skills such as `climber`), or on mountain under a roof. */
const stranded = (s: BattleState) =>
  s.units
    .filter((u) => {
      if (!u.pos || u.gone) return false;
      if (data.maps[s.mapId]!.interior && terrainOf(s, u.pos) === 'mountain') return true;
      return moveCost(data, s, u, u.pos, computeStats(data, u, { state: s, pos: u.pos }).skills.terrainCost) === null;
    })
    .map((u) => `${u.uid}@${u.pos}`);

describe('no unit on impassable terrain during a battle', () => {
  // One autoplay run per map of act 2 (the ways a unit is moved at run time: move, knockback, reinforcement, trigger spawn,
  // recruit). About 8 s per map, hence the timeout; further seeds run in QA with QA_SEEDS.
  const seeds = process.env.QA_SEEDS ? process.env.QA_SEEDS.split(',').map(Number) : [1];
  it.each(seeds)('after every command of an autoplay run on every map of act 2, seed %i', (seed) => {
    const seen: string[] = [];
    for (const node of (data.acts[2]?.nodes ?? []).filter((n) => data.maps[n.map])) {
      const c = campaignAt(data, seed, node.id, 'normal', 'standard');
      let s = beginBattle(data, c, node.id, c.roster.map((u) => u.id)).state;
      seen.push(...stranded(s).map((x) => `${node.id} start: ${x}`));
      for (let i = 0; i < 4000 && !s.outcome; i++) {
        s = applyCommand(data, s, autoCommand(data, s)).state;
        seen.push(...stranded(s).map((x) => `${node.id} turn ${s.turn}: ${x}`));
      }
    }
    expect([...new Set(seen)]).toEqual([]);
  }, 300_000);
});
