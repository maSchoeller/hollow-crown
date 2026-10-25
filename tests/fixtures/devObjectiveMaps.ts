/**
 * The developer maps of story 4.8 (`tests/fixtures/maps/dev_escort.yaml`, `dev_treasure.yaml`): small maps with the new goals
 * `escort` and `treasure`. Like `dev_fog` they are no content (no pack lists them, the campaign graph does not know them,
 * nothing ships); tests register them with `addDevObjectiveMap`, the browser starts them with `await __hc.devMap('dev_escort')`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { mapSchema } from '../../src/content/schemas';
import { createBattle, newCampaign, startBattle, type BattleState, type GameData, type MapDef } from '../../src/core';

export type DevObjectiveMapId = 'dev_escort' | 'dev_treasure';

/** The map as the game reads it; throws with the schema message when content changes break it. */
export function devObjectiveMap(id: DevObjectiveMapId, root = process.cwd()): MapDef {
  const raw = parse(readFileSync(join(root, 'tests', 'fixtures', 'maps', `${id}.yaml`), 'utf8'));
  return { ...mapSchema.parse(raw), act: 1 } as MapDef;
}

/** Adds the map and a node that plays it to `data` (in place) and starts the battle with the units the map names. */
export function addDevObjectiveMap(data: GameData, id: DevObjectiveMapId, seed = 7): BattleState {
  data.maps[id] = devObjectiveMap(id);
  const first = data.campaign.nodes[0]!;
  if (!data.campaign.nodes.some((n) => n.id === id)) {
    data.campaign = { ...data.campaign, nodes: [...data.campaign.nodes, { ...first, id, map: id, pre: undefined, post: undefined }] };
  }
  const c = newCampaign(data, seed, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = startBattle(data, createBattle(data, c, id, [])).state;
  s.lockedRoles = []; // the scout's class action works
  return s;
}
