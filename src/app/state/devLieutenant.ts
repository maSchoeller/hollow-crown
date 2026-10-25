/** Dev only: a test arena with lieutenants (story 3.1), opened by `__hc.devLieutenant` in flow.ts. Not part of the game. */
import { applyCommand, seedRng, type BattleState, type CampaignNodeDef, type Command, type GameData, type ItemRef, type LieutenantDef, type MapDef, type MapUnitDef, type Pos } from '../../core';
import { clone, inBounds, unitAt } from '../../core/util';

export interface DevLieutenant {
  id: string;
  /** 0-3 notches on the pennant */
  grudge: number;
  /** unit id the grudge points at (a company member of the battle) */
  target: string;
}

export const DEV_MAP_ID = 'dev_lieutenant';

/**
 * The prologue map with only the given lieutenants as enemies, in a row in front of the deploy area; they hold their ground.
 * Each carries the weapons he has on the real maps (`maps`), never his signature item (story 3.4: that is loot only).
 */
export function devLieutenantMap(base: MapDef, lieutenants: Record<string, LieutenantDef>, ids: readonly string[], maps: Record<string, MapDef> = {}): MapDef {
  const mapItems = (id: string, signature: string): ItemRef[] =>
    Object.values(maps)
      .flatMap((m) => m.units)
      .find((u) => u.lieutenant === id)
      ?.items.filter((r) => r.def !== signature) ?? [];
  const units: MapUnitDef[] = ids.map((id, i) => ({
    id: `dev_${id}`,
    team: 'enemy',
    class: lieutenants[id]!.class,
    lieutenant: id,
    level: 3,
    at: [3 + i * 3, 6],
    items: mapItems(id, lieutenants[id]!.signatureItem),
    ai: { profile: 'hold' },
  }));
  return { ...structuredClone(base), id: DEV_MAP_ID, units, reinforcements: [], triggers: [], objectives: { ...base.objectives, side: [] } };
}

/** The test node: the first story node's data with the arena as map, no cutscenes, no requirements. */
export function devLieutenantNode(base: CampaignNodeDef): CampaignNodeDef {
  const { fixed: _fixed, requires: _requires, pre: _pre, post: _post, ...rest } = base;
  return { ...rest, id: DEV_MAP_ID, map: DEV_MAP_ID };
}

/**
 * Story 3.2, dev only: prepares the test arena for a lieutenant to be driven off. A company unit with a melee weapon stands
 * next to him, he has 1 HP left. Returns the prepared state and the attack command; `seeded` is the same state with a seed in
 * which that attack hits, so the flight can be played for sure (`__hc.devFlee`).
 */
export function fleeSetup(
  data: GameData,
  start: BattleState,
  lieutenantId: string,
): { prepared: BattleState; seeded: BattleState; cmd: Command } | null {
  const prepared = clone(start);
  const lt = prepared.units.find((u) => u.lieutenant === lieutenantId && u.pos);
  if (!lt?.pos) return null;
  lt.hp = 1;
  const [x, y] = lt.pos;
  const free = (p: Pos) => !unitAt(prepared, p) && prepared.terrain[p[1] * prepared.width + p[0]] !== 'wall';
  const spot = ([[x, y + 1], [x, y - 1], [x + 1, y], [x - 1, y]] as Pos[]).find((p) => inBounds(prepared, p) && free(p));
  if (!spot) return null;
  for (const u of prepared.units) {
    if (u.team !== 'player' || !u.pos || u.gone) continue;
    const from = u.pos;
    u.pos = spot;
    const cmd: Command = { type: 'act', unit: u.uid, to: spot, action: { kind: 'attack', target: lt.uid } };
    for (let seed = 1; seed <= 300; seed++) {
      const seeded = clone(prepared);
      seeded.rng = seedRng(seed);
      try {
        const r = applyCommand(data, clone(seeded), cmd);
        if (r.state.units.find((v) => v.uid === lt.uid)?.gone === 'fled') return { prepared, seeded, cmd };
      } catch {
        break; // this unit cannot attack from here (range); try the next one
      }
    }
    u.pos = from;
  }
  return null;
}
