import type { GameData, Pos } from '../defs';
import { seedRng } from '../rng';
import type { BattleState, CampaignState, ObjectState } from '../state';
import { clone, onDifficulty, pairKey, posKey } from '../util';
import { lockedMechanics } from '../campaign/campaign';
import { battleUnitFromMap, battleUnitFromRecord } from './create';
import { startBattle, type ApplyResult } from './apply';

export function parseTerrain(data: GameData, mapId: string): string[] {
  const map = data.maps[mapId]!;
  const rows = map.terrain.replace(/\r/g, '').split('\n').filter((r) => r.length > 0);
  const out: string[] = [];
  for (const row of rows) for (const ch of row) out.push(map.legend[ch]!);
  return out;
}

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
  const [w, h] = map.size;
  const objects: ObjectState[] = map.objects.map((o) => ({ id: o.id, type: o.type, at: [o.at[0], o.at[1]] as Pos, state: 'closed' }));
  const seed = (c.seed * 31 + c.completed.length * 7919 + node.id.length * 131) >>> 0;
  const s: BattleState = {
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
    flags: [...c.flags],
    nextUid: c.nextUid,
    avatarName: c.avatar.name,
    locked: lockedMechanics(data, nodeId),
  };
  const forced = map.deploy.forced;
  const chosen = [...forced.filter((id) => c.roster.some((r) => r.id === id)), ...deployIds.filter((id) => !forced.includes(id))];
  const slots = map.deploy.slots;
  chosen.slice(0, Math.min(map.deploy.max, slots.length)).forEach((id, i) => {
    const rec = c.roster.find((r) => r.id === id);
    if (!rec) return;
    s.units.push(battleUnitFromRecord(data, rec, 'player', slots[i]!));
  });
  const pct = data.balance.difficulty[c.settings.difficulty].enemyStatPercent;
  onDifficulty(map.units, c.settings.difficulty).forEach((def, i) => {
    if (def.char && c.roster.some((r) => r.id === def.char)) return; // already recruited
    const uid = def.id ?? def.char ?? `m${i}`;
    s.units.push(battleUnitFromMap(data, def, s, def.team === 'enemy' ? pct : 0, uid));
  });
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
  return s;
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
