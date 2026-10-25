/** Dev only: a test arena with lieutenants (story 3.1), opened by `__hc.devLieutenant` in flow.ts. Not part of the game. */
import type { CampaignNodeDef, LieutenantDef, MapDef, MapUnitDef } from '../../core';

export interface DevLieutenant {
  id: string;
  /** 0-3 notches on the pennant */
  grudge: number;
  /** unit id the grudge points at (a company member of the battle) */
  target: string;
}

export const DEV_MAP_ID = 'dev_lieutenant';

/** The prologue map with only the given lieutenants as enemies, in a row in front of the deploy area; they hold their ground. */
export function devLieutenantMap(base: MapDef, lieutenants: Record<string, LieutenantDef>, ids: readonly string[]): MapDef {
  const units: MapUnitDef[] = ids.map((id, i) => ({
    id: `dev_${id}`,
    team: 'enemy',
    class: lieutenants[id]!.class,
    lieutenant: id,
    level: 3,
    at: [3 + i * 3, 6],
    items: [{ def: lieutenants[id]!.signatureItem }],
    ai: { profile: 'hold' },
  }));
  return { ...structuredClone(base), id: DEV_MAP_ID, units, reinforcements: [], triggers: [], objectives: { ...base.objectives, side: [] } };
}

/** The test node: the first story node's data with the arena as map, no cutscenes, no requirements. */
export function devLieutenantNode(base: CampaignNodeDef): CampaignNodeDef {
  const { fixed: _fixed, requires: _requires, pre: _pre, post: _post, ...rest } = base;
  return { ...rest, id: DEV_MAP_ID, map: DEV_MAP_ID };
}
