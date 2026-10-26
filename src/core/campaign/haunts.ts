/**
 * The haunt generator (story 5.5, architecture §5.6): each day packet brings 1-3 haunts on completed story maps that have
 * an anchor, against a lieutenant who is still against the company. The enemies are made here and kept in the state so that
 * playing and replaying agree. Pure: all randomness comes from a stream seeded by campaign seed and day number.
 */
import type { Difficulty, GameData, HauntAnchor, HauntEnemyType, HauntVariant, LieutenantDef, MapDef, Pos } from '../defs';
import type { CampaignState, HauntEnemy, HauntState } from '../state';
import { hash32, nextInt, pick, seedRng, type RngState } from '../rng';
import { areaTiles, clone, posKey } from '../util';
import { standableTiles } from '../battle/hauntMap';
import { availableNodes } from './graph';
import type { CampaignEvent } from './commands';
import { activeLieutenants, lieutenantState } from './lieutenants';

/** Foes on a difficulty: places + `haunt.extraEnemies`, the lieutenant included; easy one fewer, hard one more (as on story maps). */
export function hauntEnemyCount(data: Pick<GameData, 'balance'>, places: number, difficulty: Difficulty): number {
  const shift = difficulty === 'easy' ? -1 : difficulty === 'hard' ? 1 : 0;
  return Math.max(1, places + data.balance.haunt.extraEnemies + shift);
}

/** The places of a haunt: the anchor's `max`, else `deploy.max` of the map. */
export const hauntPlaces = (map: Pick<MapDef, 'deploy'>, anchor: Pick<HauntAnchor, 'max'>): number => anchor.max ?? map.deploy.max;

/** The army level the haunts are made for: the expected level of the next story node to play, else that of the last one done. */
export function hauntLevel(data: GameData, c: CampaignState): number {
  const next = availableNodes(data, c).find((n) => n.kind === 'story');
  if (next) return next.expectedLevel;
  const done = data.campaign.nodes.filter((n) => n.kind === 'story' && c.completed.includes(n.id));
  return done.length ? done[done.length - 1]!.expectedLevel : 1;
}

/** Picks an enemy type by its `share` (percent; the shares add up to 100). */
function pickType(rng: RngState, types: readonly HauntEnemyType[]): HauntEnemyType {
  let roll = nextInt(rng, 100);
  for (const t of types) {
    if (roll < t.share) return t;
    roll -= t.share;
  }
  return types[types.length - 1]!;
}

/** Takes a random tile out of `free` that suits `moveType`; null when none is left. */
function takeTile(data: GameData, map: MapDef, anchor: HauntAnchor, rng: RngState, free: Set<string>, moveType: string): Pos | null {
  const ok = standableTiles(data, map, anchor.enemySpawn, moveType).filter((p) => free.has(posKey(p)));
  if (!ok.length) return null;
  const at = pick(rng, ok);
  free.delete(posKey(at));
  return at;
}

/** The enemies of one haunt: the lieutenant, then the rest by the pool of his faction. */
function makeEnemies(data: GameData, c: CampaignState, map: MapDef, anchor: HauntAnchor, lt: LieutenantDef, types: readonly HauntEnemyType[], level: number, rng: RngState): HauntEnemy[] {
  const count = hauntEnemyCount(data, hauntPlaces(map, anchor), c.settings.difficulty);
  const free = new Set(areaTiles(anchor.enemySpawn).map(posKey));
  const mtOf = (cls: string) => data.classes[cls]?.moveType ?? 'foot';
  const out: HauntEnemy[] = [];
  // boss, rout and treasure: the lieutenant stands on the target; defend and escort: he comes with the rest from the spawn area
  const onTarget = anchor.variant === 'boss' || anchor.variant === 'rout' || anchor.variant === 'treasure';
  const ltAt = onTarget ? anchor.target.at : takeTile(data, map, anchor, rng, free, mtOf(lt.class));
  if (!ltAt) return out;
  // the lieutenant is only named: story 5.6 builds him at play time (level, grudge, kit of his class) like `createBattle` does
  out.push({ at: [ltAt[0], ltAt[1]], lieutenant: lt.id });
  for (let i = 1; i < count; i++) {
    const t = pickType(rng, types);
    const at = takeTile(data, map, anchor, rng, free, mtOf(t.class));
    if (!at) break;
    out.push({ class: t.class, sprite: t.sprite, nameKey: t.nameKey, level, items: clone(t.items), at: [at[0], at[1]] });
  }
  return out;
}

/** The anchor variants a map offers for a new haunt: not the one played last, unless it is the only one. */
function variantsFor(map: MapDef, last: string | undefined): HauntAnchor[] {
  const all = map.haunts ?? [];
  const other = all.filter((a) => a.variant !== last);
  return other.length ? other : all;
}

/** One haunt on `map` at `anchor` against `lt`: the enemies are made now and stay as they are. Null when the spawn area holds no place for the lieutenant. */
export function makeHaunt(data: GameData, c: CampaignState, map: MapDef, anchor: HauntAnchor, lt: LieutenantDef, id: string, day: number, rng: RngState): HauntState | null {
  const level = hauntLevel(data, c);
  const enemies = makeEnemies(data, c, map, anchor, lt, data.hauntPools[lt.act]!.factions[lt.faction]!, level, rng);
  return enemies.length ? { id, day, map: map.id, variant: anchor.variant, lt: lt.id, level, enemies, new: true } : null;
}

/**
 * The haunts of day packet `day` (appended to `c.haunts`, a copy): 1-3 (`haunt.perDay`) on completed story maps with an
 * anchor that are not haunted right now, each map once, a variant other than the last played there, against a lieutenant
 * the company has met, of an act the campaign has reached, who has not joined the company (one lieutenant may lead several haunts). Beyond `haunt.maxOpen` the oldest lapses.
 */
export function spawnHaunts(data: GameData, c: CampaignState, day: number, events: CampaignEvent[]): number {
  const cfg = data.balance.haunt;
  const rng = seedRng(hash32(c.seed, day));
  const n = cfg.perDay.min + nextInt(rng, cfg.perDay.max - cfg.perDay.min + 1);
  const taken = new Set(c.haunts.map((h) => h.map));
  const maps: MapDef[] = [];
  for (const node of data.campaign.nodes) {
    const map = data.maps[node.map];
    if (node.kind !== 'story' || !c.completed.includes(node.id) || !map?.haunts?.length) continue;
    if (!maps.includes(map)) maps.push(map);
  }
  const lieutenants = activeLieutenants(data, c).filter((lt) => lieutenantState(c, lt.id).met && lt.act <= data.campaign.act && data.hauntPools?.[lt.act]?.factions[lt.faction]?.length);
  let made = 0;
  for (let i = 0; i < n; i++) {
    const free = maps.filter((m) => !taken.has(m.id));
    if (!free.length || !lieutenants.length) break;
    const map = pick(rng, free);
    const anchor = pick(rng, variantsFor(map, c.hauntLast[map.id]));
    const lt = pick(rng, lieutenants);
    const haunt = makeHaunt(data, c, map, anchor, lt, `h${day}_${i}`, day, rng);
    if (!haunt) continue;
    taken.add(map.id);
    c.haunts.push(haunt);
    events.push({ t: 'hauntSpawned', id: haunt.id, map: haunt.map, variant: haunt.variant as HauntVariant, lt: haunt.lt });
    made++;
    while (c.haunts.length > cfg.maxOpen) {
      const gone = c.haunts.shift()!;
      taken.delete(gone.map);
      events.push({ t: 'hauntExpired', id: gone.id });
    }
  }
  return made;
}

/** The gold of a haunt before the halving: `haunt.goldPct` percent of the mean `goldReward` of the story maps of the act, rounded. */
export function hauntGold(data: GameData): number {
  const maps = data.campaign.nodes.filter((n) => n.kind === 'story').map((n) => data.maps[n.map]).filter((m): m is MapDef => !!m);
  const mean = maps.length ? maps.reduce((a, m) => a + m.goldReward, 0) / maps.length : 0;
  return Math.round((mean * data.balance.haunt.goldPct) / 100);
}

/** Whether the haunt now won pays half gold and half bounty: it is the `haunt.halveFromNth`-th or a later one since the last story mission. */
export const hauntHalved = (data: GameData, c: Pick<CampaignState, 'hauntsSinceStory'>): boolean => c.hauntsSinceStory >= data.balance.haunt.halveFromNth - 1;
