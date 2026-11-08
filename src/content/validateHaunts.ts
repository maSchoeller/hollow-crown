import type { GameData } from '../core/gameData';
import type { ItemRef, Pos } from '../core/defs';
import type { Area, MapDef } from '../core/mapDefs';
import { hauntEnemyCount } from '../core/campaign/haunts';
import { hauntPlaces, standableTiles } from '../core/battle/hauntMap';
import { areaTiles, posKey } from '../core/util';
import type { Locales } from './load';
import { walkable, type Terr } from './validateWalk';

/**
 * Haunt anchors of a map (story 5.5, architecture §5.6): at most one per variant; the fields lie on the map and can be
 * stood on; target and chests are no deploy or spawn field; enough deploy fields for the places and enough spawn fields for the
 * foes of the hardest difficulty (places + extraEnemies + 1); and the company can walk from every deploy field to the target,
 * every chest, or an exit (a closed door counts as passable, as for `treasure`).
 */
export function validateHaunts(data: GameData, map: MapDef, err: (f: string, m: string) => void, g: Terr): void {
  const f = `maps/${map.id}`;
  const seen = new Set<string>();
  if (map.noHaunts && map.haunts?.length) err(f, 'haunts: the map has noHaunts (it is never haunted), it takes no haunt anchors');
  const pool = data.hauntPools?.[map.act];
  for (const a of map.haunts ?? []) {
    const ctx = `haunts ${a.variant}`;
    if (seen.has(a.variant)) err(f, `${ctx}: listed twice (one anchor per variant)`);
    seen.add(a.variant);
    const places = hauntPlaces(data, map, a);
    const onMap = (area: Area, what: string): boolean => {
      const tiles = areaTiles(area);
      if (!tiles.length || tiles.some((p) => !g.inside(p))) {
        err(f, `${ctx}: ${what} empty or out of bounds`);
        return false;
      }
      return true;
    };
    const deployOk = onMap(a.deploy, 'deploy');
    const spawnOk = onMap(a.enemySpawn, 'enemySpawn');
    const deployTiles = deployOk ? standableTiles(data, map, a.deploy, 'foot') : [];
    if (deployOk && deployTiles.length < places) err(f, `${ctx}: ${deployTiles.length} deploy fields for ${places} places`);
    const spawnNeed = hauntEnemyCount(data, places, 'hard');
    if (spawnOk && standableTiles(data, map, a.enemySpawn, 'foot').length < spawnNeed)
      err(f, `${ctx}: ${standableTiles(data, map, a.enemySpawn, 'foot').length} spawn fields for ${spawnNeed} foes on hard`);
    const keys = (area: Area) => new Set(areaTiles(area).map(posKey));
    const dk = keys(a.deploy);
    const sk = keys(a.enemySpawn);
    if (deployOk && spawnOk && [...dk].some((k) => sk.has(k))) err(f, `${ctx}: deploy and enemySpawn overlap`);
    // goals: the target, every chest, and an exit tile (any one of them will do)
    const goals: Array<[string, Pos[]]> = [['target', [a.target.at]]];
    if (a.chests) {
      if (new Set(a.chests.map(posKey)).size !== a.chests.length) err(f, `${ctx}: a chest is listed twice`);
      a.chests.forEach((p, i) => goals.push([`chest ${i}`, [p]]));
    }
    const exitTiles = a.exit && onMap(a.exit, 'exit') ? areaTiles(a.exit) : [];
    if (exitTiles.length) {
      if (exitTiles.some((p) => p[0] === a.target.at[0] && p[1] === a.target.at[1])) err(f, `${ctx}: the civilian starts on the exit`);
      goals.push(['exit', exitTiles]);
    }
    for (const [what, tiles] of goals) {
      if (what === 'exit') continue;
      for (const p of tiles) {
        if (!g.inside(p)) err(f, `${ctx}: ${what} ${p} out of bounds`);
        else if (dk.has(posKey(p)) || sk.has(posKey(p))) err(f, `${ctx}: ${what} ${p} lies in deploy or enemySpawn`);
        else if (!standableTiles(data, map, { tiles: [p] }, 'foot').length) err(f, `${ctx}: ${what} ${p} is no tile to stand on (impassable or an object)`);
      }
    }
    // reachability on foot (ignoring units) from every deploy field
    // walking is symmetric: fields of one connected region share their walk (large maps, content:check runs in many tests)
    const walks: Array<Set<string>> = [];
    for (const d of deployTiles) {
      let reach = walks.find((w) => w.has(posKey(d)));
      if (!reach) walks.push((reach = walkable(d, 'foot', g)));
      for (const [what, tiles] of goals) if (!tiles.some((p) => reach.has(posKey(p)))) err(f, `${ctx}: ${what} not reachable on foot from deploy field ${d}`);
    }
    // the civilian of an escort must reach the exit with its own move type
    if (a.variant === 'escort' && pool && exitTiles.length) {
      const reach = walkable(a.target.at, data.classes[pool.civilian.class]?.moveType ?? 'foot', g);
      if (!exitTiles.some((p) => reach.has(posKey(p)))) err(f, `${ctx}: the exit is not reachable by the civilian from its start`);
    }
  }
}

/** The haunt pools of the acts (story 5.5): classes, items, sprites, names; shares add up to 100; every faction of a lieutenant has a pool. */
export function validateHauntPools(data: GameData, locales: Locales, err: (f: string, m: string) => void, spriteIds?: Set<string>): void {
  const f = 'haunts.yaml';
  const itemOk = (ctx: string, ref: ItemRef) => {
    if (!data.items[ref.def]) err(f, `${ctx}: unknown item ${ref.def}`);
  };
  const nameOk = (ctx: string, key: string) => {
    for (const lang of ['de', 'en']) if (!locales[lang]?.[key]) err(`locales/${lang}`, `${ctx}: missing key ${key}`);
  };
  const spriteOk = (ctx: string, id: string | undefined) => {
    if (spriteIds && id && !spriteIds.has(id)) err(f, `${ctx}: unknown sprite ${id}`);
  };
  for (const [act, pools] of Object.entries(data.hauntPools ?? {})) {
    for (const [faction, types] of Object.entries(pools.factions)) {
      const ctx = `act ${act} ${faction}`;
      const total = types.reduce((a, t) => a + t.share, 0);
      if (total !== 100) err(f, `${ctx}: shares add up to ${total}, expected 100`);
      for (const t of types) {
        if (!data.classes[t.class]) err(f, `${ctx}: unknown class ${t.class}`);
        t.items.forEach((r) => itemOk(`${ctx} ${t.class}`, r));
        spriteOk(`${ctx} ${t.class}`, t.sprite);
        nameOk(`${ctx} ${t.class}`, t.nameKey);
      }
    }
    const civ = pools.civilian;
    if (!data.classes[civ.class]) err(f, `act ${act} civilian: unknown class ${civ.class}`);
    spriteOk(`act ${act} civilian`, civ.sprite);
    nameOk(`act ${act} civilian`, civ.nameKey);
    // the goal text of defend and escort names the civilian by the unit id (`unit.civilian.name`)
    nameOk(`act ${act} civilian`, 'unit.civilian.name');
    for (const loot of pools.chestLoot) if (loot.item) itemOk(`act ${act} chestLoot`, loot.item);
  }
  // every faction of a lieutenant has a pool in the act of the lieutenant
  for (const lt of Object.values(data.lieutenants ?? {})) {
    if (!data.hauntPools?.[lt.act]?.factions[lt.faction]) err(f, `${lt.id}: no haunt pool for faction ${lt.faction} in act ${lt.act}`);
  }
  // a map with anchors belongs to an act that has pools (the civilian of defend and escort)
  for (const m of Object.values(data.maps)) if (m.haunts?.length && !data.hauntPools?.[m.act]) err(`maps/${m.id}`, `haunts: act ${m.act} has no haunts.yaml`);
  // the haunt material of an act is the bounty material of the act's lieutenants (checked by validateLieutenants)
}
