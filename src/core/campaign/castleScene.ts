/**
 * What the castle shows (story 10.14): the build-up of every room, the castle tier and the companions' keepsakes.
 *
 * A pure view of the campaign — it reads `c.home`, `c.roster`, `c.fallen` and `c.left` and keeps no state of its own.
 * `src/render/home/castle.ts` only switches the parts of the model file after it. The places live in the model
 * (`tools/art/blender_paktwacht.py`, decision 2026-11-06, not in `home.yaml`); `CASTLE_PLACES` lists them so the content
 * check and this view can name them without reaching into `src/render`, and `tests/unit/castle-model.test.ts` holds the
 * list against the model script.
 */
import type { GameData } from '../gameData';
import type { CampaignState } from '../state';
import { castleTier } from './castle';
import { homeRooms, roomLevel } from './camp';

/**
 * The keepsake places of the castle model, each a part `<id>_a` (art direction §7, keepsakes approved 2026-11-07 in
 * `concept/22-narrative/burg-gegenstaende-vorschlag.md`). Only lower-case letters: the part name pattern of the scene
 * allows no digits and no underscore in the group. [ASSUMPTION]
 */
export const CASTLE_PLACES: readonly string[] = [
  // courtyard
  'axe', // Brenna, smithy: axe stand next to the forge
  'cauldron', // Grosk, smithy: cooking pot between forge and campfire
  'lute', // Jory, campfire: lute on the bench
  'dice', // Varek, tavern: dice board on the table in front of the door
  'shield', // Tobin, convoy: painted shield on the wagon's side
  'pelts', // Mira, training ground: drying rack at the shooting range
  'wolfpelt', // Ilka, training ground: white wolf pelt over a bench
  'trinkets', // Fenn, workshop: crate of odds and ends under the workbench
  'seachart', // Nell, merchant: sea chart with compass on the counter
  'satchel', // Amos, healer: field surgeon's satchel at the door
  'sabre', // Sable, the gate's guard room (no room of her own)
  // upper ledge
  'books', // Ysolde, enchanter: stack of books
  'altar', // Liora, memorial hall: small house altar next to the entrance
  'cuirass', // Odile, academy: polished cuirass on a stand
  'emberstone', // Brann, enchanter: boulder with an ember vein at the rock face
];

/**
 * What a keepsake place shows:
 * - `present`: the companion is with the company, his keepsake stands at its place
 * - `mourned`: he fell — the keepsake stays where it is, desaturated in the memorial style, and the memorial hall has his stone
 * - `gone`: he left the company and took his keepsake with him; no stone
 * - `none`: he never joined, so there is nothing there
 */
export type KeepsakeState = 'none' | 'present' | 'mourned' | 'gone';

export interface CastleKeepsake {
  /** place in the model (`CASTLE_PLACES`) */
  id: string;
  /** the companion it belongs to */
  char: string;
  state: KeepsakeState;
  /** does the memorial hall carry his stone? (only the fallen do; see `memorialStones`) */
  stone: boolean;
}

export interface CastleScene {
  /** walls, keep and land (0 ruin … 3 fortress) */
  tier: number;
  /** room id → level it shows at; 0 = not built in this home or act */
  rooms: Record<string, number>;
  /** one entry per keepsake place of a companion the content knows, in the order the act unit files list them */
  keepsakes: CastleKeepsake[];
}

/** The castle as the campaign has it; mercenaries have no place, so they never appear. */
export function castleScene(data: GameData, c: CampaignState): CastleScene {
  const rooms: Record<string, number> = {};
  for (const id of Object.keys(data.rooms)) rooms[id] = 0;
  for (const { room } of homeRooms(data, c)) rooms[room.id] = roomLevel(c, room.id);
  const fallen = new Set(c.fallen.map((f) => f.id));
  const left = new Set(c.left);
  const here = new Set(c.roster.map((r) => r.id));
  const keepsakes: CastleKeepsake[] = [];
  for (const ch of Object.values(data.chars)) {
    if (!ch.homeObject) continue;
    const state: KeepsakeState = fallen.has(ch.id) ? 'mourned' : left.has(ch.id) ? 'gone' : here.has(ch.id) ? 'present' : 'none';
    keepsakes.push({ id: ch.homeObject, char: ch.id, state, stone: state === 'mourned' });
  }
  return { tier: castleTier(data, c), rooms, keepsakes };
}
