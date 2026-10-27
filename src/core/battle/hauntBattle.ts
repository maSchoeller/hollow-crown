/**
 * The battle of a haunt (story 5.6, architecture §5.6): the story map (terrain, objects, light, effects) with the deploy
 * fields, goal and defeat conditions of the anchor's variant (`hauntMap`), the enemies stored with the haunt, and the
 * civilian of defend and escort. Built through the same skeleton as `createBattle`, so a lieutenant is scaled to the company
 * and his grudge (`planLieutenants`) exactly as on a story map.
 */
import type { GameData, MapDef, MapUnitDef } from '../defs';
import type { BattleState, CampaignState, HauntState } from '../state';
import { hash32 } from '../rng';
import { hauntLevel } from '../campaign/haunts';
import { planLieutenants } from '../campaign/lieutenants';
import { isScout } from '../rules/scout';
import { newItem } from './create';
import { HAUNT_CIVILIAN, hauntMap } from './hauntMap';
import { battleSkeleton, deployPlayers, finishSetup, placeMapUnits } from './setup';
import { startBattle, type ApplyResult } from './apply';

const textHash = (text: string): number => [...text].reduce((h, ch) => hash32(h, ch.charCodeAt(0)), 0);

/** The story node of a map: the haunt takes its place on the world map, its name and its merchant tier (the first story node that uses the map). */
export function storyNodeOf(data: GameData, mapId: string) {
  return data.campaign.nodes.find((n) => n.kind === 'story' && n.map === mapId);
}

/**
 * How a lieutenant stands on a story map (the first unit of the content that names him): his kit and what drops. A haunt
 * builds him from it through `planLieutenants`, so grudge, tiered weapons and grudge skills are right (Produktinhaber 2026-10-26).
 */
function lieutenantTemplate(data: GameData, lt: string): MapUnitDef | undefined {
  for (const m of Object.values(data.maps)) {
    if (m.id.startsWith('haunt~')) continue;
    const defs = [...m.units, ...m.reinforcements.flatMap((r) => r.units), ...m.triggers.flatMap((t) => t.then.flatMap((a) => (a.action === 'spawn' ? a.units : [])))];
    const found = defs.find((d) => d.lieutenant === lt && d.team === 'enemy');
    if (found) return found;
  }
  return undefined;
}

/** The map units of a haunt: its enemies as stored, and the civilian of defend and escort. */
export function hauntUnitDefs(data: GameData, h: HauntState, base: MapDef): MapUnitDef[] {
  const anchor = base.haunts!.find((a) => a.variant === h.variant)!;
  // enemies wait until the company comes close, like on story maps
  const defs: MapUnitDef[] = h.enemies.map((e, i) => {
    if (e.lieutenant) {
      const tpl = lieutenantTemplate(data, e.lieutenant);
      const def = data.lieutenants[e.lieutenant]!;
      // he waits at his place until the company comes close, then goes for it
      return {
        id: e.lieutenant,
        lieutenant: e.lieutenant,
        team: 'enemy',
        class: def.class,
        level: tpl?.level ?? 1,
        at: e.at,
        items: tpl?.items ?? [],
        ...(tpl?.drops ? { drops: tpl.drops } : {}),
        ai: { profile: 'trigger', radius: data.balance.haunt.triggerRadius.lieutenant, then: 'aggressive' },
      } as MapUnitDef;
    }
    return { id: `e${i}`, team: 'enemy', class: e.class!, level: e.level!, at: e.at, nameKey: e.nameKey!, sprite: e.sprite!, items: e.items ?? [], ai: { profile: 'trigger', radius: data.balance.haunt.triggerRadius.enemy, then: 'aggressive' } } as MapUnitDef;
  });
  const civilian = data.hauntPools?.[base.act]?.civilian;
  if (civilian && (anchor.variant === 'defend' || anchor.variant === 'escort')) {
    defs.push({
      id: HAUNT_CIVILIAN,
      team: 'other',
      class: civilian.class,
      // at the army level the haunt was made for, so he is no easier prey than the company (Produktinhaber 2026-10-26)
      level: h.level,
      at: anchor.target.at,
      nameKey: civilian.nameKey,
      ...(civilian.sprite ? { sprite: civilian.sprite } : {}),
      ...(civilian.portrait ? { portrait: civilian.portrait } : {}),
      items: [],
      ai: anchor.variant === 'defend' ? { profile: 'hold' } : { profile: 'follow' },
    } as MapUnitDef);
  }
  return defs;
}

/**
 * Builds the battle of haunt `hauntId` with the chosen units. The seed comes from the campaign seed and the haunt id, so
 * a replay is reproducible. A treasure hunt gives the company keys when it brings no scout (every chest needs one, a scout
 * needs none).
 */
export function createHauntBattle(data: GameData, c: CampaignState, hauntId: string, deployIds: string[]): BattleState {
  const h = c.haunts.find((x) => x.id === hauntId)!;
  const base = data.maps[h.map]!;
  const map = hauntMap(data, h.map, h.variant, h.lt);
  const defs = hauntUnitDefs(data, h, base);
  const plan = planLieutenants(data, c, { units: defs, reinforcements: [], triggers: [] }, c.settings.difficulty);
  const s = battleSkeleton(data, c, map, storyNodeOf(data, h.map)!.id, hash32(c.seed, textHash(h.id)), plan);
  s.hauntId = h.id;
  s.hauntLevel = hauntLevel(data, c);
  deployPlayers(data, c, s, map, deployIds);
  placeMapUnits(data, c, s, defs);
  finishSetup(data, s, map);
  if (h.variant === 'treasure' && !s.units.some((u) => isScout(data, s, u))) {
    const players = s.units.filter((x) => x.team === 'player');
    let left = base.haunts!.find((a) => a.variant === 'treasure')!.chests!.length - players.reduce((n, u) => n + u.bag.filter((i) => data.items[i.def]?.use?.open?.includes('chest')).length, 0);
    for (const u of players) {
      while (left > 0 && u.bag.length < data.balance.bag.size) {
        u.bag.push(newItem(s, 'door_key', data));
        left--;
      }
    }
  }
  return s;
}

/** Creates the haunt battle and plays the opening events. */
export function beginHauntBattle(data: GameData, c: CampaignState, hauntId: string, deployIds: string[]): ApplyResult {
  return startBattle(data, createHauntBattle(data, c, hauntId, deployIds));
}
