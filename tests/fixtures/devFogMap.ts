/**
 * The developer map of story 2.6 (fog, a door, a chest, a scout and a few foes): `tests/fixtures/maps/dev_fog.yaml`, read here
 * like the game reads a map. It is no content: no pack lists it and the campaign graph does not know it, so it never ships.
 * Tests register it with `addDevFogMap`; in the browser it can be shown with the console snippet in the story file.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { mapSchema } from '../../src/content/schemas';
import { createBattle, newCampaign, startBattle, type BattleState, type GameData, type MapDef } from '../../src/core';

export const DEV_FOG_MAP_ID = 'dev_fog';

/** The map as the game reads it; throws with the schema message when content changes break it. */
export function devFogMap(root = process.cwd()): MapDef {
  const raw = parse(readFileSync(join(root, 'tests', 'fixtures', 'maps', 'dev_fog.yaml'), 'utf8'));
  return { ...mapSchema.parse(raw), act: 1 } as MapDef;
}

/** Adds the map and a node that plays it to `data` (in place) and starts the battle with the units the map names. */
export function addDevFogMap(data: GameData): BattleState {
  data.maps[DEV_FOG_MAP_ID] = devFogMap();
  const first = data.campaign.nodes[0]!;
  if (!data.campaign.nodes.some((n) => n.id === DEV_FOG_MAP_ID)) {
    data.campaign = { ...data.campaign, nodes: [...data.campaign.nodes, { ...first, id: DEV_FOG_MAP_ID, map: DEV_FOG_MAP_ID, pre: undefined, post: undefined }] };
  }
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = startBattle(data, createBattle(data, c, DEV_FOG_MAP_ID, [])).state;
  s.lockedRoles = []; // the map brings a scout, a marksman and a vanguard along: all class actions work
  return s;
}
