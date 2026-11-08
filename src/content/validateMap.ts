import { type ItemRef, type Pos } from '../core/defs';
import type { GameData } from '../core/gameData';
import type { Area, MapDef, MapUnitDef, Reward } from '../core/mapDefs';
import type { Condition } from '../core/storyDefs';
import { areaTiles, posKey } from '../core/util';
import type { Locales } from './load';
import { validateFormat } from './validateFormat';
import { validateHaunts } from './validateHaunts';
import { validatePhases } from './validatePhases';
import type { ContentRefs } from './validateRefs';
import { allUnits, validateObjectAccess, walkable, type Terr } from './validateWalk';

/** Terrain grid, units, objects, objectives, triggers and reachability of one battle map. */
export function validateMap(
  data: GameData,
  map: MapDef,
  err: (f: string, m: string) => void,
  item: (f: string, r: ItemRef | undefined, c: string) => void,
  dialogue: (f: string, id: string | undefined, c: string) => void,
  reward: (f: string, r: Reward | undefined, c: string) => void,
  locales: Locales,
  conditions: (f: string, conds: Condition[] | undefined, ctx: string) => void,
): void {
  const f = `maps/${map.id}`;
  const [w, h] = map.size;
  const rows = map.terrain.replace(/\r/g, '').split('\n').filter((r) => r.length > 0);
  if (rows.length !== h) err(f, `terrain has ${rows.length} rows, size says ${h}`);
  const grid: string[][] = [];
  rows.forEach((row, y) => {
    if (row.length !== w) err(f, `row ${y} has ${row.length} chars, size says ${w}`);
    const line: string[] = [];
    for (const ch of row) {
      const t = map.legend[ch];
      if (!t) err(f, `row ${y}: char '${ch}' not in legend`);
      else if (!data.terrain[t]) err(f, `legend '${ch}': unknown terrain ${t}`);
      line.push(t ?? 'plain');
    }
    grid.push(line);
  });
  const inside = (p: Pos) => p[0] >= 0 && p[1] >= 0 && p[0] < w && p[1] < h;
  const terr = (p: Pos) => data.terrain[grid[p[1]]?.[p[0]] ?? 'plain'];
  const levels = new Map<string, number>();
  for (const l of map.levels ?? [])
    for (const p of areaTiles(l.area)) {
      if (!inside(p)) err(f, `levels: ${p} out of bounds`);
      levels.set(`${p[0]},${p[1]}`, l.level);
    }
  const level = (p: Pos) => levels.get(`${p[0]},${p[1]}`) ?? terr(p)?.level ?? 0;
  const g: Terr = { inside, terr, level, freeMoveTypes: data.balance.elevation.freeMoveTypes };
  // a connector leads to exactly one tile a level above it: that is how it knows which way it faces
  grid.forEach((line, y) =>
    line.forEach((_, x) => {
      const p: Pos = [x, y];
      if (!terr(p)?.connector) return;
      const up = ([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as Pos[]).filter((n) => inside(n) && level(n) === level(p) + 1);
      if (up.length !== 1) err(f, `${terr(p)!.id} at ${p}: needs exactly one neighbour a level higher, has ${up.length}`);
    }),
  );
  for (const t of map.triggers)
    for (const a of t.then) if (a.action === 'set_terrain' && !data.terrain[a.terrain]) err(f, `${t.id}: set_terrain to unknown terrain ${a.terrain}`);
  // `set_ai`: known units; `flee` needs a way out (the area of the action or the one the unit already has); its tiles lie on the map and can be walked
  for (const t of map.triggers)
    for (const a of t.then) {
      if (a.action !== 'set_ai') continue;
      for (const id of a.units) {
        const u = allUnits(map).find((x) => x.id === id);
        if (!u) err(f, `${t.id}: set_ai for unknown unit ${id}`);
        else if (a.profile === 'flee' && !a.area && !u.ai?.area) err(f, `${t.id}: set_ai flee for ${id} without an area to flee to`);
      }
      for (const p of a.area ? areaTiles(a.area) : [])
        if (!inside(p) || terr(p)?.cost.foot === null) err(f, `${t.id}: set_ai area ${p} is off the map or impassable`);
    }
  const checkUnit = (u: MapUnitDef, ctx: string) => {
    if (!data.classes[u.class]) err(f, `${ctx}: unknown class ${u.class}`);
    if (u.char && !data.chars[u.char]) err(f, `${ctx}: unknown char ${u.char}`);
    if (!inside(u.at)) err(f, `${ctx}: position ${u.at} out of bounds`);
    else {
      const mt = data.classes[u.class]?.moveType ?? 'foot';
      if (terr(u.at)?.cost[mt] === null) err(f, `${ctx}: placed on impassable ${terr(u.at)?.id}`);
    }
    u.items.forEach((r) => item(f, r, ctx));
    dialogue(f, u.quote, ctx);
    dialogue(f, u.recruit?.dialogue, ctx);
    for (const d of u.drops ?? []) if (d >= u.items.length) err(f, `${ctx}: drop index ${d} out of range`);
  };
  map.units.forEach((u, i) => {
    const ctx = u.id ?? `unit ${i}`;
    checkUnit(u, ctx);
    // a unit with `requires` (story 9.5) is left out at the creation of the battle: nothing may depend on it. A lieutenant may carry
    // it too (story 11.10, Sable after E7): left out, he has no unit, so his plan for the map stays without effect
    if (u.requires) {
      conditions(f, u.requires, `${ctx}.requires`);
      const ids = [u.id, u.char].filter((x): x is string => !!x);
      const v = map.objectives.victory;
      if (v.type === 'boss' && ids.includes(v.unit)) err(f, `${ctx}: the boss of the victory goal cannot have requires`);
      for (const o of map.objectives.side) if (o.unit && ids.includes(o.unit)) err(f, `${ctx}: the unit of side objective ${o.id} cannot have requires`);
      for (const other of map.units) if (other.ai?.target && ids.includes(other.ai.target)) err(f, `${ctx}: ${other.id ?? 'a unit'} targets it (ai.target) but it can be left out`);
    }
  });
  map.reinforcements.forEach((r, i) =>
    r.units.forEach((u, j) => {
      checkUnit(u, `reinforcement ${i}.${j}`);
      if (u.requires) err(f, `reinforcement ${i}.${j}: requires is only for the line-up units of a map`);
    }),
  );
  for (const t of map.triggers)
    for (const a of t.then) if (a.action === 'spawn') for (const u of a.units) if (u.requires) err(f, `${t.id}: requires is only for the line-up units of a map`);
  if (map.deploy.slots.length < map.deploy.max) err(f, 'deploy.slots < deploy.max');
  for (const s of map.deploy.slots) if (!inside(s)) err(f, `deploy slot ${s} out of bounds`);
  for (const o of map.objects) {
    if (!inside(o.at)) err(f, `${o.id}: out of bounds`);
    // a door or gate is terrain and object at once (story 2.6): it blocks the path and sight until opened
    if (o.type === 'door' && inside(o.at) && !terr(o.at)?.opensTo) err(f, `${o.id}: a door object needs a closed passage (door, gate_closed) on its tile`);
    if (o.type === 'lever' && inside(o.at) && terr(o.at)?.prop !== 'lever') err(f, `${o.id}: a lever object needs the terrain "lever" on its tile`);
    if (o.type === 'ballista' && inside(o.at) && terr(o.at)?.id !== 'ballista') err(f, `${o.id}: a ballista object needs the terrain "ballista" on its tile`);
    for (const id of o.links ?? []) if (!map.objects.some((m) => m.id === id)) err(f, `${o.id}: links unknown object ${id}`);
    for (const id of o.links ?? []) if (map.objects.some((m) => m.id === id && m.type === 'ballista')) err(f, `${o.id}: links the ballista ${id}, which nothing opens`);
    reward(f, o.reward, o.id);
    reward(f, o.contents, o.id);
  }
  for (const t of map.triggers) for (const a of t.then) if (a.action === 'dialogue') dialogue(f, a.id, t.id);
  // Balliste (story 11.6): its tile and its object come together; it is never "activated" (its open state means: fired this phase)
  grid.forEach((row, y) =>
    row.forEach((id, x) => {
      if (id === 'ballista' && !map.objects.some((o) => o.type === 'ballista' && o.at[0] === x && o.at[1] === y)) err(f, `terrain ballista at ${x},${y} without a ballista object`);
    }),
  );
  for (const t of map.triggers)
    if (t.when.type === 'object_activated' && map.objects.some((o) => o.id === (t.when as { object: string }).object && o.type === 'ballista'))
      err(f, `${t.id}: object_activated never fires for a ballista`);
  for (const s of map.objectives.side) {
    reward(f, s.reward, s.id);
    if (s.reward.chronicle) err(f, `${s.id}: a side objective cannot pay a chronicle page (chests and villages can)`);
  }
  for (const s of map.deploy.slots) if (inside(s) && terr(s)?.cost.foot === null) err(f, `deploy slot ${s} on impassable ${terr(s)?.id}`);
  // reachability on foot from the deploy area (ignoring units, along the levels and their connectors): the goal of the mission
  const v = map.objectives.victory;
  const start = map.deploy.slots[0];
  const fromDeploy = start ? walkable(start, 'foot', g) : undefined;
  // story 11.8: the escape of a second phase counts like any escape goal
  const goalArea: Area | undefined = v.type === 'reach' || v.type === 'seize' || v.type === 'escape' ? v.area : v.type === 'survive' ? v.then?.area : undefined;
  if (goalArea && fromDeploy && !areaTiles(goalArea).some((p) => fromDeploy.has(posKey(p)))) err(f, 'victory area not reachable on foot from the deploy area');
  if (v.type === 'boss' && fromDeploy) {
    const boss = map.units.find((u) => u.id === v.unit || u.char === v.unit);
    if (boss && !fromDeploy.has(posKey(boss.at))) err(f, `boss ${v.unit} not reachable on foot from the deploy area`);
  }
  // a foe who attacks must be able to walk to the company: one who walls himself in stands around for ever
  if (start) {
    const byMoveType = new Map<string, Set<string>>();
    for (const u of [...map.units, ...map.reinforcements.flatMap((r) => r.units)]) {
      const profile = u.ai?.profile === 'trigger' ? u.ai.then : u.ai?.profile;
      if (u.team !== 'enemy' || !inside(u.at) || (profile !== undefined && profile !== 'aggressive' && profile !== 'hunt')) continue;
      const mt = data.classes[u.class]?.moveType ?? 'foot';
      // walking is symmetric, so one walk from the deploy area serves all foes of a move type
      if (!byMoveType.has(mt)) byMoveType.set(mt, walkable(start, mt, g));
      if (!byMoveType.get(mt)!.has(posKey(u.at))) err(f, `${u.id ?? u.class} at ${u.at}: cannot walk to the deploy area`);
    }
  }
  if (v.type === 'escort') validateEscort(data, map, v, err, g, locales);
  if (v.type === 'treasure') validateTreasure(data, map, v, err, g);
  validatePhases(map, err);
  validateFormat(data, map, locales, err);
  validateObjectAccess(data, map, g, err);
  validateHaunts(data, map, err, g);
}

/**
 * `escort` (story 4.8): the NPC is a map unit of team `other` with profile `follow`, starts outside the exit, can walk to the
 * exit with its own move type, and (unless `join: false`) is a character whose id is the unit id, so it can join afterwards.
 * The deploy area must reach the NPC on foot, or the company never gets close enough to wake it.
 */
function validateEscort(
  data: GameData,
  map: MapDef,
  v: Extract<MapDef['objectives']['victory'], { type: 'escort' }>,
  err: (f: string, m: string) => void,
  g: Terr,
  locales: Locales,
): void {
  const f = `maps/${map.id}`;
  const npc = allUnits(map).find((u) => u.id === v.unit);
  if (!npc) return err(f, `escort: unit ${v.unit} not on the map`);
  if (npc.team !== 'other') err(f, `escort: ${v.unit} must be team other`);
  if (npc.ai?.profile !== 'follow') err(f, `escort: ${v.unit} needs the AI profile follow`);
  // a unit with `char: <id>` names its character already; a missing one is reported as unknown char (story 11.10)
  if (v.join !== false && !data.chars[v.unit] && npc.char !== v.unit) err(f, `escort: ${v.unit} joins afterwards, so it needs a character of the same id (or join: false)`);
  // the goal sentence and the defeat line name the NPC (`unit.<id>.name`)
  for (const lang of ['de', 'en']) if (!locales[lang]?.[`unit.${v.unit}.name`]) err(f, `escort: missing locale key unit.${v.unit}.name in ${lang}`);
  const exit = areaTiles(v.area);
  if (!exit.length || exit.some((p) => !g.inside(p))) err(f, 'escort: exit area empty or out of bounds');
  if (exit.some((p) => p[0] === npc.at[0] && p[1] === npc.at[1])) err(f, `escort: ${v.unit} starts on the exit`);
  const reach = walkable(npc.at, data.classes[npc.class]?.moveType ?? 'foot', g);
  if (!exit.some((p) => reach.has(`${p[0]},${p[1]}`))) err(f, `escort: the exit is not reachable by ${v.unit} from its start`);
  for (const s of map.deploy.slots) {
    if (!walkable(s, 'foot', g).has(`${npc.at[0]},${npc.at[1]}`)) err(f, `escort: ${v.unit} not reachable on foot from deploy slot ${s}`);
  }
}

/**
 * `treasure` (story 4.8): the chests are distinct chest objects of the map, each reachable on foot from every deploy slot
 * (doors count as passable), and the company can open them: the map brings an opener along, that is a player unit of the
 * map, a forced deploy character, or an item a village hands out that is a scout (class action `open_steal`) or carries a
 * key (an item whose `use.open` lists `chest`). The roster of the company is not known here, so a map that relies on a
 * scout or key from the roster must still bring one itself.
 */
function validateTreasure(
  data: GameData,
  map: MapDef,
  v: Extract<MapDef['objectives']['victory'], { type: 'treasure' }>,
  err: (f: string, m: string) => void,
  g: Terr,
): void {
  const f = `maps/${map.id}`;
  if (new Set(v.chests).size !== v.chests.length) err(f, 'treasure: chest listed twice');
  const reach = map.deploy.slots.map((s) => walkable(s, 'foot', g));
  for (const id of v.chests) {
    const o = map.objects.find((x) => x.id === id);
    if (!o || o.type !== 'chest') {
      err(f, `treasure: ${id} is no chest of the map`);
      continue;
    }
    reach.forEach((r, i) => {
      if (!r.has(`${o.at[0]},${o.at[1]}`)) err(f, `treasure: chest ${id} not reachable on foot from deploy slot ${map.deploy.slots[i]}`);
    });
  }
  const key = (refs: ItemRef[]) => refs.some((r) => data.items[r.def]?.use?.open?.includes('chest'));
  const scout = (cls: string) => data.classes[cls]?.classAction?.id === 'open_steal';
  const opener =
    map.units.some((u) => u.team === 'player' && (scout(u.class) || key(u.items))) ||
    map.deploy.forced.some((id) => {
      const c = data.chars[id];
      return !!c && (scout(c.class) || key(c.items));
    }) ||
    map.objects.some((o) => o.type === 'village' && o.reward?.item && key([o.reward.item])) ||
    // a foe on the map from the start who drops a key (story 9.8: looters carry the keys, so the hunt never depends on a scout)
    map.units.some((u) => u.team === 'enemy' && (u.drops ?? []).some((i) => u.items[i] && key([u.items[i]!])));
  if (!opener) err(f, 'treasure: no scout or key available (a player unit, a forced character, a village reward or a foe dropping one must bring it)');
}

/** Map triggers set flags of the register, waves read them. */
export function validateMapFlags(data: GameData, { flag }: ContentRefs): void {
  for (const map of Object.values(data.maps)) {
    for (const t of map.triggers)
      for (const a of t.then) if (a.action === 'set_flag') flag(`maps/${map.id}`, a.flag, `trigger ${t.id}`);
    map.reinforcements.forEach((r, i) => {
      if (r.unlessFlag) flag(`maps/${map.id}`, r.unlessFlag, `reinforcement ${i}.unlessFlag`);
    });
  }
}
