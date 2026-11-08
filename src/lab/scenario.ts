/**
 * Testlabor M1 (concept/24-architecture/testlabor-2026-11-07.md): a lab scenario is a battle situation written as YAML. One loader for
 * all three uses, so they never drift apart: `pnpm lab <file>` (tools/lab.ts), `__hc.lab(name)` / `?lab=name` in the dev build
 * (src/app/state/devLab.ts) and `labState(file)` in Vitest (tests/fixtures/lab.ts). Dev and test only: nothing in the production
 * build imports this module.
 *
 * ```yaml
 * map: m1_4_wolfslager         # a content map, or a fixture map of tests/fixtures/maps (dev_fog …)
 * node: m1_4                   # optional: the campaign node (default: the node that plays the map, else a stand-in node)
 * seed: 3                      # RNG of the battle (default 1)
 * difficulty: normal           # default normal
 * company: expected            # expected (who joined before the node), none, or a list of character ids (+ the avatar)
 * level: 6                     # optional: the company's level (default: the node's expectedLevel)
 * flags: { e02: protect }      # campaign flags before the battle (units with `requires`)
 * turn: 4
 * units:                       # changes to units already on the board, by id or uid
 *   liora: { at: [10, 3], hp: 9, items: [shine], status: [burning] }
 *   osric: { hp: 12, stats: { spd: 9 }, level: 7 }
 * add:                         # new units in the map's own unit format
 *   - { id: lab_wolf, team: enemy, class: wolf, level: 3, at: [5, 5] }
 * remove: [enemy:wolf*, m12]   # ids/uids with `*`, optionally with team prefix; `enemy:*` clears the foes
 * fire: [[4, 3], [4, 4]]       # burning tiles (or { tiles: [...], turns: 3 }), like a map's initialEffects
 * terrain: { "4,5": forest }   # tile → terrain id
 * ```
 * The battle always starts in the player's phase of `turn`: the enemy phase is one core command (`endPhase`), `pnpm lab --enemy` plays it.
 */
import { z } from 'zod';
import { mapSchema, mapUnitSchema } from '../content/schemaMap';
import {
  addToRoster,
  autoEquip,
  battleUnitFromPlan,
  beginBattle,
  computeStats,
  levelUp,
  newCampaign,
  newItem,
  posKey,
  seedRng,
  type BattleState,
  type BattleUnit,
  type CampaignState,
  type GameData,
  type MapDef,
  type Pos,
  type StatusId,
} from '../core';

const STATUS_IDS = ['burning', 'wet', 'slowed', 'knockback'] as const satisfies readonly StatusId[];
const pos = z.tuple([z.number().int().min(0), z.number().int().min(0)]);
const statKeys = ['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'] as const;

const unitPatchSchema = z
  .object({
    /** tile; `null` takes the unit off the board */
    at: pos.nullable().optional(),
    hp: z.number().int().min(0).optional(),
    /** raised with the game's own level-up (never lowered) */
    level: z.number().int().min(1).optional(),
    class: z.string().optional(),
    /** base stats, absolute (class, items and skills still count on top) */
    stats: z.partialRecord(z.enum(statKeys), z.number().int()).optional(),
    /** `burning` (default length of the status) or `{ id: burning, turns: 2 }` */
    status: z.array(z.union([z.enum(STATUS_IDS), z.object({ id: z.enum(STATUS_IDS), turns: z.number().int().min(1) })])).optional(),
    /** replaces everything the unit carries; the game puts each item in its best slot */
    items: z.array(z.string()).optional(),
    acted: z.boolean().optional(),
    moved: z.boolean().optional(),
  })
  .strict();

export const labScenarioSchema = z
  .object({
    /** one line: what the scenario asks */
    question: z.string().optional(),
    map: z.string(),
    node: z.string().optional(),
    seed: z.number().int().default(1),
    difficulty: z.enum(['easy', 'normal', 'hard']).default('normal'),
    company: z.union([z.enum(['expected', 'none']), z.array(z.string())]).default('expected'),
    level: z.number().int().min(1).optional(),
    flags: z.record(z.string(), z.union([z.string(), z.number(), z.literal(true)])).default({}),
    turn: z.number().int().min(1).default(1),
    units: z.record(z.string(), unitPatchSchema).default({}),
    add: z.array(z.unknown()).default([]),
    remove: z.array(z.string()).default([]),
    fire: z.union([z.array(pos), z.object({ tiles: z.array(pos), turns: z.number().int().min(1) })]).optional(),
    terrain: z.record(z.string().regex(/^\d+,\d+$/), z.string()).default({}),
  })
  .strict();

export type LabScenario = z.infer<typeof labScenarioSchema>;

export class LabError extends Error {}

/** Reads a fixture map by id (Node: from disk, browser: import.meta.glob); undefined when there is none. */
export type FixtureMapSource = (id: string) => unknown;

export interface LabResult {
  state: BattleState;
  campaign: CampaignState;
  scenario: LabScenario;
}

const AVATAR = { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as const;

function fail(msg: string, valid?: Iterable<string>): never {
  throw new LabError(valid ? `${msg}; valid: ${[...valid].join(', ')}` : msg);
}

/** Parses a scenario document (already read from YAML) and reports schema errors with their path. */
export function parseLabScenario(raw: unknown, name = 'scenario'): LabScenario {
  const r = labScenarioSchema.safeParse(raw);
  if (r.success) return r.data;
  fail(`${name}: ${r.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')}`);
}

/** Makes `id` playable: a content map stays as it is, a fixture map is parsed and registered in `data` with a stand-in node (like `__hc.devMap`). */
function resolveNode(data: GameData, sc: LabScenario, fixtures: FixtureMapSource | undefined): string {
  if (!data.maps[sc.map]) {
    const raw = fixtures?.(sc.map);
    if (raw === undefined) fail(`no map "${sc.map}"`, [...Object.keys(data.maps)].sort());
    data.maps[sc.map] = { ...mapSchema.parse(raw), act: 1 } as MapDef;
  }
  if (sc.node) {
    const n = data.acts[1]!.nodes.find((x) => x.id === sc.node);
    if (!n) fail(`no node "${sc.node}"`, data.acts[1]!.nodes.map((x) => x.id));
    if (n.map !== sc.map) fail(`node "${sc.node}" plays map "${n.map}", not "${sc.map}"`);
    return n.id;
  }
  const own = data.acts[1]!.nodes.find((x) => x.map === sc.map);
  if (own) return own.id;
  const id = `lab_${sc.map}`;
  if (!data.acts[1]!.nodes.some((n) => n.id === id)) {
    const first = data.acts[1]!.nodes[0]!;
    data.acts[1]! = { ...data.acts[1]!, nodes: [...data.acts[1]!.nodes, { ...first, id, map: sc.map, pre: undefined, post: undefined }] };
  }
  return id;
}

/** The campaign the battle is built from: a throwaway one, as `__hc.devNode` and `pnpm sim --fresh` build it. */
function labCampaign(data: GameData, sc: LabScenario, nodeId: string): CampaignState {
  const c = newCampaign(data, sc.seed, { difficulty: sc.difficulty, deathMode: 'standard' }, { ...AVATAR });
  const order = data.acts[1]!.nodes.map((n) => n.id);
  const idx = order.indexOf(nodeId);
  const node = data.acts[1]!.nodes[idx]!;
  const stand = node.id.startsWith('lab_');
  if (Array.isArray(sc.company)) {
    for (const id of sc.company) {
      if (!data.chars[id]) fail(`company: no character "${id}"`, Object.keys(data.chars));
      if (!c.roster.some((u) => u.id === id)) addToRoster(data, c, id);
    }
  } else if (sc.company === 'expected' && !stand) {
    for (const ch of Object.values(data.chars)) {
      const j = order.indexOf(ch.joins);
      if (j >= 0 && j < idx) addToRoster(data, c, ch.id);
    }
  }
  const level = sc.level ?? (stand ? 1 : node.expectedLevel);
  for (const u of c.roster) while (u.level < level) levelUp(data, u, c.rng);
  if (!stand) c.completed = order.slice(0, idx);
  for (const [k, v] of Object.entries(sc.flags)) c.flags[k] = v;
  return c;
}

function globMatch(pattern: string, value: string): boolean {
  const re = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
  return re.test(value);
}

function findUnit(s: BattleState, ref: string): BattleUnit {
  const u = s.units.find((x) => x.uid === ref) ?? s.units.find((x) => x.id === ref) ?? s.units.find((x) => x.charId === ref);
  if (!u) fail(`no unit "${ref}" on the board`, unitIds(s));
  return u;
}

/** uid (and id where it differs) of every unit on the board, for error messages and the CLI. */
export function unitIds(s: BattleState): string[] {
  return s.units.filter((u) => u.pos && !u.gone).map((u) => (u.id && u.id !== u.uid ? `${u.uid}(${u.id})` : u.uid));
}

function checkTile(s: BattleState, p: Pos, what: string): void {
  if (p[0] >= s.width || p[1] >= s.height) fail(`${what}: tile ${p.join(',')} is outside the ${s.width}×${s.height} map`);
}

function patchUnit(data: GameData, s: BattleState, u: BattleUnit, p: z.infer<typeof unitPatchSchema>, ref: string): void {
  if (p.class !== undefined) {
    if (!data.classes[p.class]) fail(`units.${ref}.class: no class "${p.class}"`, Object.keys(data.classes));
    u.classId = p.class;
  }
  if (p.level !== undefined) {
    if (p.level < u.level) fail(`units.${ref}.level: ${p.level} is below the unit's level ${u.level} (levels only go up)`);
    while (u.level < p.level) levelUp(data, u, s.rng);
  }
  for (const [k, v] of Object.entries(p.stats ?? {})) u.stats[k as (typeof statKeys)[number]] = v;
  if (p.items) {
    for (const id of p.items) if (!data.items[id]) fail(`units.${ref}.items: no item "${id}"`, Object.keys(data.items));
    u.equip = {};
    u.bag = [];
    autoEquip(data, u, p.items.map((id) => newItem(s, id, data)));
  }
  if (p.at !== undefined) {
    if (p.at) checkTile(s, p.at, `units.${ref}.at`);
    u.pos = p.at;
    if (!p.at) u.gone = 'retreated';
  }
  if (p.status) {
    const turns = data.balance.terrainEffects.burningDuration;
    u.status = p.status.map((x) => (typeof x === 'string' ? { id: x, turns } : x));
  }
  const max = computeStats(data, u).maxHp;
  if (p.hp !== undefined && p.hp > max) fail(`units.${ref}.hp: ${p.hp} is above the unit's max HP ${max}`);
  // a changed class, level or stats change the max HP: a unit left at full health stays at full health
  u.hp = p.hp ?? (p.class !== undefined || p.level !== undefined || p.stats ? max : Math.min(u.hp, max));
  if (p.acted !== undefined) u.acted = p.acted;
  if (p.moved !== undefined) u.moved = p.moved;
}

/**
 * Builds the battle of a scenario: campaign → `beginBattle` (opening events included) → the scenario's changes → the scenario's seed.
 * Mutates `data` only to register a fixture map and its stand-in node. Throws `LabError` with the valid ids on a wrong reference.
 */
export function buildLab(data: GameData, raw: unknown, fixtures?: FixtureMapSource, name?: string): LabResult {
  const sc = parseLabScenario(raw, name);
  const nodeId = resolveNode(data, sc, fixtures);
  const c = labCampaign(data, sc, nodeId);
  // a list deploys exactly those (and the avatar, who leads the army); `expected` everyone who has joined
  const deploy = sc.company === 'none' ? [] : c.roster.map((u) => u.id).filter((id) => !Array.isArray(sc.company) || id === c.roster[0]!.id || sc.company.includes(id));
  const s = beginBattle(data, c, nodeId, deploy).state;
  s.lockedRoles = []; // every role's class action works, as on a fixture map
  if (sc.company === 'none') s.units = s.units.filter((u) => !u.fromRoster);

  for (const pattern of sc.remove) {
    const m = /^(player|enemy|other):(.*)$/.exec(pattern);
    const team = m?.[1];
    const glob = m ? m[2]! : pattern;
    const hit = s.units.filter((u) => (!team || u.team === team) && (globMatch(glob, u.uid) || globMatch(glob, u.id)));
    if (!hit.length) fail(`remove: "${pattern}" matches no unit`, unitIds(s));
    s.units = s.units.filter((u) => !hit.includes(u));
  }

  sc.add.forEach((rawDef, i) => {
    const r = mapUnitSchema.safeParse(rawDef);
    if (!r.success) fail(`add[${i}]: ${r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`);
    const def = r.data as MapDef['units'][number];
    if (!data.classes[def.class]) fail(`add[${i}].class: no class "${def.class}"`, Object.keys(data.classes));
    checkTile(s, def.at, `add[${i}].at`);
    const uid = def.id ?? def.char ?? `lab${i}`;
    if (s.units.some((u) => u.uid === uid)) fail(`add[${i}]: uid "${uid}" is taken`);
    const pct = def.team === 'enemy' ? data.balance.difficulty[sc.difficulty].enemyStatPercent : 0;
    s.units.push(battleUnitFromPlan(data, def, s, pct, uid));
  });

  for (const [ref, p] of Object.entries(sc.units)) patchUnit(data, s, findUnit(s, ref), p, ref);

  for (const [k, t] of Object.entries(sc.terrain)) {
    const p = k.split(',').map(Number) as Pos;
    checkTile(s, p, `terrain.${k}`);
    if (!data.terrain[t]) fail(`terrain.${k}: no terrain "${t}"`, Object.keys(data.terrain));
    s.terrain[p[1] * s.width + p[0]] = t;
    delete s.timers[posKey(p)];
  }
  if (sc.fire) {
    const tiles = Array.isArray(sc.fire) ? sc.fire : sc.fire.tiles;
    const turns = Array.isArray(sc.fire) ? data.balance.terrainEffects.burningDuration : sc.fire.turns;
    for (const t of tiles) {
      checkTile(s, t, 'fire');
      const idx = t[1] * s.width + t[0];
      const was = s.terrain[idx]!;
      s.timers[posKey(t)] = { kind: 'burning', turns, revertTo: was === 'burning' ? 'plain' : was };
      s.terrain[idx] = 'burning';
    }
  }

  const taken = new Map<string, string>();
  for (const u of s.units) {
    if (!u.pos || u.gone) continue;
    const k = posKey(u.pos);
    if (taken.has(k)) fail(`two units on tile ${k}: ${taken.get(k)} and ${u.uid}`);
    taken.set(k, u.uid);
  }
  s.turn = sc.turn;
  s.phase = 'player';
  s.rng = seedRng(sc.seed);
  return { state: s, campaign: c, scenario: sc };
}
