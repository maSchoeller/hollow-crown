import type { GameData, MapDef, Pos } from '../defs';
import { seedRng } from '../rng';
import type { BattleState, CampaignState, ObjectState } from '../state';
import { applyVillageAid } from '../rules/items';
import { clone, onDifficulty, pairKey, posKey } from '../util';
import { lockedMechanics, lockedRoles } from '../campaign/graph';
import { conditionContext, onConditions } from '../campaign/conditions';
import { isJoined, planLieutenants } from '../campaign/lieutenants';
import { battleUnitFromPlan, battleUnitFromRecord } from './create';
import { startBattle, type ApplyResult } from './apply';
import { parseTerrain } from './terrain';

export { parseTerrain };

/** Units that must / can be deployed for a node. */
export function deployInfo(data: GameData, c: CampaignState, nodeId: string) {
  const node = data.campaign.nodes.find((n) => n.id === nodeId)!;
  const map = data.maps[node.map]!;
  return { map, max: map.deploy.max, forced: map.deploy.forced.filter((id) => c.roster.some((r) => r.id === id)) };
}

/**
 * Builds the battle state for a campaign node with the chosen units (concept/02 Vorbereitung).
 * The battle RNG is derived from the campaign seed and the node so replays are reproducible.
 */
export function createBattle(data: GameData, c: CampaignState, nodeId: string, deployIds: string[]): BattleState {
  const node = data.campaign.nodes.find((n) => n.id === nodeId)!;
  const map = data.maps[node.map]!;
  const seed = (c.seed * 31 + c.completed.length * 7919 + node.id.length * 131) >>> 0;
  // every lieutenant of the map is scaled here, from the campaign, so those who arrive later are built the same (review R1)
  const s = battleSkeleton(data, c, map, nodeId, seed, planLieutenants(data, c, map, c.settings.difficulty));
  deployPlayers(data, c, s, map, deployIds);
  placeMapUnits(data, c, s, map.units);
  finishSetup(data, s, map);
  return s;
}

/** The empty battle on `map`: terrain, objects, campaign settings and the plan of its lieutenants; no units yet. Shared by story nodes and haunts. */
export function battleSkeleton(data: GameData, c: CampaignState, map: MapDef, nodeId: string, seed: number, lieutenantPlan: BattleState['lieutenantPlan']): BattleState {
  const [w, h] = map.size;
  const objects: ObjectState[] = map.objects.map((o) => ({ id: o.id, type: o.type, at: [o.at[0], o.at[1]] as Pos, state: 'closed' }));
  return {
    mapId: map.id,
    nodeId,
    turn: 1,
    phase: 'player',
    rng: seedRng(seed),
    width: w,
    height: h,
    terrain: parseTerrain(data, map.id),
    timers: {},
    units: [],
    objects,
    loot: [],
    firedTriggers: [],
    reinforcementsDone: [],
    stats: { villagesVisited: [], chestsOpened: [], downs: 0, recruited: [] },
    outcome: null,
    settings: clone(c.settings),
    convoy: clone(c.convoy),
    goldGained: 0,
    materialsGained: {},
    itemsGained: [],
    supports: clone(c.supports),
    flags: Object.keys(c.flags),
    nextUid: c.nextUid,
    avatarName: c.avatar.name,
    locked: lockedMechanics(data, c),
    lockedRoles: lockedRoles(data, c),
    lieutenantPlan,
  };
}

/** The company on the deploy slots of `map`: forced units first, then the chosen ones, up to the map's limit. */
export function deployPlayers(data: GameData, c: CampaignState, s: BattleState, map: MapDef, deployIds: string[]): void {
  const forced = map.deploy.forced;
  const chosen = [...forced.filter((id) => c.roster.some((r) => r.id === id)), ...deployIds.filter((id) => !forced.includes(id))];
  const slots = map.deploy.slots;
  chosen.slice(0, Math.min(map.deploy.max, slots.length)).forEach((id, i) => {
    const rec = c.roster.find((r) => r.id === id);
    if (!rec) return;
    const unit = battleUnitFromRecord(data, rec, 'player', slots[i]!);
    applyVillageAid(data, c.villageAid, unit.bag);
    s.units.push(unit);
  });
}

/**
 * The map's own units on the board at the campaign's difficulty and story (a recruited character and a lieutenant who joined stay off;
 * a unit with `requires` only appears when they hold, story 9.5).
 */
export function placeMapUnits(data: GameData, c: CampaignState, s: BattleState, defs: MapDef['units']): void {
  const pct = data.balance.difficulty[c.settings.difficulty].enemyStatPercent;
  onConditions(conditionContext(data, c), onDifficulty(defs, c.settings.difficulty)).forEach((def, i) => {
    if (def.char && c.roster.some((r) => r.id === def.char)) return; // already recruited
    if (def.lieutenant && isJoined(c, def.lieutenant)) return; // a lieutenant who joined the company stays off the board (story 3.7)
    const uid = def.id ?? def.char ?? `m${i}`;
    // a lieutenant is scaled to the company and its grudge (story 3.4); everything else is built as the map says
    const plan = def.lieutenant ? s.lieutenantPlan![def.lieutenant] : undefined;
    const unit = battleUnitFromPlan(data, def, s, def.team === 'enemy' ? pct : 0, uid, plan);
    s.units.push(unit);
  });
}

/** Support pairs the map starts with, and its burning tiles. */
export function finishSetup(data: GameData, s: BattleState, map: MapDef): void {
  const w = map.size[0];
  for (const p of map.pairs) {
    s.supports[pairKey(p.a, p.b)] = { points: data.balance.supports.thresholds[p.rank], rank: p.rank };
  }
  for (const eff of map.initialEffects) {
    for (const t of eff.tiles) {
      const idx = t[1] * w + t[0];
      s.timers[posKey(t)] = { kind: 'burning', turns: eff.turns, revertTo: s.terrain[idx]! };
      s.terrain[idx] = 'burning';
    }
  }
}

/** Creates the battle and plays the opening events. */
export function beginBattle(data: GameData, c: CampaignState, nodeId: string, deployIds: string[]): ApplyResult {
  return startBattle(data, createBattle(data, c, nodeId, deployIds));
}

/** Swaps the deploy positions of two player units before the first move (preparation). */
export function swapDeploy(s: BattleState, a: string, b: string): BattleState {
  const st = clone(s);
  const ua = st.units.find((u) => u.uid === a);
  const ub = st.units.find((u) => u.uid === b);
  if (!ua?.pos || !ub?.pos) return s;
  const tmp = ua.pos;
  ua.pos = ub.pos;
  ub.pos = tmp;
  return st;
}
