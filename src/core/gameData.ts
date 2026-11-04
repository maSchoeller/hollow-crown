/** All content of the game in one object, as the content layer (src/content) builds it from the YAML. */
import type { Balance } from './balanceDefs';
import type { AffixDef, CharDef, ClassDef, HomeKind, ItemDef, RuneDef, SetDef, SkillDef } from './defs';
import type { HauntPoolsDef, MapDef, TerrainDef } from './mapDefs';
import type { HandbookDef, RenderDef, WorldDef } from './renderDefs';
import type { CampaignDef, ChroniclePageDef, FlagDef, HomeViewDef, LieutenantDef, MemorialDef, RoomDef, SceneDef, SupportPairDef } from './storyDefs';

export interface GameData {
  balance: Balance;
  render: RenderDef;
  classes: Record<string, ClassDef>;
  chars: Record<string, CharDef>;
  items: Record<string, ItemDef>;
  skills: Record<string, SkillDef>;
  affixes: Record<string, AffixDef>;
  runes: Record<string, RuneDef>;
  sets: Record<string, SetDef>;
  /** home rooms in display order (`content/core/rooms.yaml`) */
  rooms: Record<string, RoomDef>;
  terrain: Record<string, TerrainDef>;
  maps: Record<string, MapDef>;
  scenes: Record<string, SceneDef>;
  /** flag register of the acts */
  flags: Record<string, FlagDef>;
  /** fixed support pairs of the acts by `pairKey` (`acts/actN/supports.yaml`) */
  supports: Record<string, SupportPairDef>;
  /** chronicle pages of the acts (`acts/actN/chronicle.yaml`) */
  chronicle: Record<string, ChroniclePageDef>;
  /** fixed memorial stones of the acts (`acts/actN/memorials.yaml`) */
  memorials: Record<string, MemorialDef>;
  /** picture and room anchors per kind of home (`content/home/home.yaml`) */
  home: Record<HomeKind, HomeViewDef>;
  campaign: CampaignDef;
  world: WorldDef;
  /** enemy lieutenants of the acts (`acts/actN/lieutenants.yaml`, story 3.1) */
  lieutenants: Record<string, LieutenantDef>;
  /** enemy pools of the haunts by act (`acts/actN/haunts.yaml`, story 5.5) */
  hauntPools: Record<number, HauntPoolsDef>;
  /** the rules handbook (`content/core/handbook.yaml`, epic 14); absent in hand-built test data */
  handbook?: HandbookDef;
}
