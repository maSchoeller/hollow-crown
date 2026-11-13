/**
 * Chained act simulation (story 6.8): plays the story missions of an act one after another with AI on both sides and a
 * simple home heuristic in between (heal scars, buy healing items, upgrade the strongest units' weapons), so gold, EP and
 * difficulty are checked across the whole act. Targets (NFR12 corridors, GDD gold curve) come from `balance.yaml` `simulation`.
 *
 * Story 11.4: over the acts. `prepareActData` opens the later act for the run (`releasedActs`), loads a map from a file and moves the
 * position level; a run then plays act 1 to its finale, moves on with the act transition (story 11.1) and plays the next act. A node
 * whose map is not built yet is skipped (counted as done, so the sequence goes on) and reported.
 */
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { mapSchema } from '../src/content/schemaMap';
import {
  addToRoster,
  levelUp,
  nodeAct,
  positionNow,
  type CampaignNodeDef,
  type FlagValue,
  type MapDef,
  actOf,
  enterNextAct,
  findNode,
  applyCampaign,
  applyEffects,
  availableNodes,
  autoplay,
  beginBattle,
  conditionContext,
  createHauntBattle,
  currentTier,
  effectiveLevel,
  promoteError,
  roomBuild,
  roomLevel,
  scarCost,
  homeRooms,
  promotionTargets,
  evalConditions,
  finishBattle,
  itemCategory,
  itemDef,
  merchantStock,
  newCampaign,
  startBattle,
  upgradeCost,
  validateCampaign,
  type BattleResult,
  type CampaignCommand,
  type CampaignState,
  type DeathMode,
  type Difficulty,
  type GameData,
  nodeLevel,
} from '../src/core';
import { aiPhaseTimes } from './enemyPhase';

export interface CampaignSimOptions {
  runs: number;
  seed: number;
  difficulty: Difficulty;
  deathMode: DeathMode;
  /** after each won story mission one day passes and the haunts then open are played (one attempt each, story 5.6) */
  haunts?: boolean;
  /** stops each run after this many missions, without counting it as finished (a whole run takes half a minute on the large maps) */
  maxMissions?: number;
  /** story 15.10: called with the campaign right before each story mission (after the home heuristic), e.g. to keep it for tuning */
  onMission?: (node: string, c: CampaignState, run: number) => void;
  /** story 11.4: the act the run aims at (`--campaign actN`); acts before it are played chained, unless `start` is `expected` */
  act?: number;
  /** story 11.4, `--start expected`: no run through the acts before; the company of act 1 starts the act on the level P of its first mission */
  start?: 'chained' | 'expected';
  /** story 11.4, `--order a,b`: among the story nodes open at once (the pairs), these come first, in this order; else file order */
  order?: string[];
  /** story 11.4, `--flags name=value,…`: campaign flags set at the start of each run (the outcome of a decision; no value = true) */
  flags?: string[];
  /** story 11.4, `--position k`: P of the target node (`node`) is k; `prepareActData` moves `positionLevel.base` to match */
  position?: number;
  /** story 11.4, `--map-file`: a map YAML; it plays at the node whose map has its id, else at `node` */
  mapFile?: string;
  /** story 11.4, `--node`: the target node for `--map-file` and `--position` (default: the first story node of the act without a map) */
  node?: string;
}

/** Per story mission, summed over all runs that reached it. */
export interface MissionSim {
  node: string;
  map: string;
  expectedLevel: number;
  /** runs that reached the mission */
  reached: number;
  /** won at the first attempt */
  wins: number;
  /** falls to 0 HP of player units at the first attempt, rescued or not (corridor: per run) */
  downs: number;
  /** gold of the won attempt: everything, and the part from side objectives */
  gold: number;
  sideGold: number;
  /** runs that won the mission at all (restarts allowed) */
  cleared: number;
  /** effective army level (average of the strongest `armySize`) before the mission */
  armyLevel: number;
  /** story 10.1: room levels built above level 1 before the mission (all rooms of the home, summed) */
  rooms: number;
  /** companions lost for good in the won attempt */
  deaths: number;
  /** story 15.10, first attempts won: rounds, player actions (move, act, pursue) and units deployed at the start, summed */
  turns: number;
  actions: number;
  deployed: number;
  /** story 15.10, AI phases of the first attempts won (`tools/enemyPhase.ts`, ms at tempo 1×): count, sums and the longest */
  phases: number;
  phaseSingle: number;
  phaseMarch: number;
  phaseSingleMax: number;
  phaseMarchMax: number;
  /** story 15.11: what the board plays with „Gemeinsam“ after the time budget of an enemy phase (`PhaseTime.shown`) */
  phaseShown: number;
  phaseShownMax: number;
  /** Testlabor S1: rounds of each first attempt won, in run order (for p10/p50/p90) */
  winTurns: number[];
  /** Testlabor S1: side objective id → runs whose won attempt fulfilled it (out of `cleared`) */
  side: Record<string, number>;
}

export interface CampaignSim {
  missions: MissionSim[];
  /** runs that reached the end of the act */
  finished: number;
  /** gold and army level when the act ends (finished runs) */
  endGold: number;
  endArmyLevel: number;
  /** spent by the home heuristic over the act (all runs) */
  spent: { heal: number; buy: number; upgrade: number; rooms: number };
  /** haunts played between the missions (all runs): played, won, gold they paid, fallen companions */
  haunts: { played: number; won: number; gold: number; fallen: number };
  /** story 11.4: runs that reached the aimed act, summed army level and gold when its first node comes up (after the camp and haunts) */
  entry: { runs: number; armyLevel: number; gold: number };
  /** story 11.4: node → runs that skipped it, its map is not built (placeholders of a later act) */
  skipped: Record<string, number>;
}

export interface MissionFlags {
  win?: 'low' | 'high';
  downs?: 'low' | 'high';
  gold?: 'low' | 'high';
  side?: 'low' | 'high';
  level?: 'low' | 'high';
}

const AVATAR = { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as const;
/** first try plus three restarts */
const MAX_ATTEMPTS = 4;

/** Effective army level: average of the strongest `simulation.armySize` units (GDD Figurensystem). */
export function armyLevel(data: GameData, c: CampaignState): number {
  const top = c.roster
    .map((u) => effectiveLevel(data, u))
    .sort((a, b) => b - a)
    .slice(0, data.balance.simulation.armySize);
  return top.length ? top.reduce((a, b) => a + b, 0) / top.length : 0;
}

function tryCmd(data: GameData, c: CampaignState, cmd: CampaignCommand): CampaignState {
  return validateCampaign(data, c, cmd) ? c : applyCampaign(data, c, cmd).campaign;
}

/** The node's own reward (campaign.yaml `effects`, e.g. Fenn's recruit): `finishBattle` leaves it to the `finishMission` command, the simulations apply it here. */
export function applyNodeRewards(data: GameData, c: CampaignState, nodeId: string): void {
  const node = findNode(data, nodeId);
  applyEffects(data, c, node?.effects ?? [], []);
  for (const g of node?.effectsIf ?? []) if (evalConditions(conditionContext(data, c), g.requires)) applyEffects(data, c, g.effects, []);
  // like finishMission: after the finale the company moves on where the next act is released (story 11.1)
  enterNextAct(data, c);
}

/** Room levels built above level 1 (story 10.1: the sim shows them next to the gold). */
export const roomUpgrades = (data: GameData, c: CampaignState): number => Object.keys(data.rooms).reduce((n, id) => n + Math.max(0, roomLevel(c, id) - 1), 0);

/**
 * Story 10.1 [ASSUMPTION]: builds rooms up, `balance.simulation.roomOrder` first (smith, academy, healer, training ground),
 * then the rest in rooms.yaml order, while the gold left after the build still pays one scar and the cheapest next weapon
 * upgrade of the strongest units (the GDD's "one of three big investments" per mission).
 */
export function buildRooms(data: GameData, c0: CampaignState, reserveUpgrade: number, spent?: CampaignSim['spent']): CampaignState {
  let c = c0;
  const first = data.balance.simulation.roomOrder;
  const order = [...first, ...homeRooms(data, c).map((st) => st.room.id).filter((id) => !first.includes(id))];
  for (let built = true; built; ) {
    built = false;
    for (const id of order) {
      const b = roomBuild(data, c, id);
      if (b.error !== null || c.gold - b.gold < scarCost(data, c) + reserveUpgrade) continue;
      const g = c.gold;
      const next = tryCmd(data, c, { type: 'buildRoom', room: id });
      if (next === c) continue;
      c = next;
      if (spent) spent.rooms += g - c.gold;
      built = true;
      break;
    }
  }
  return c;
}

/** Between missions: unlock ready supports, promote, build rooms up, heal scars, buy one healing item per strong unit, then upgrade weapons. */
export function homeHeuristic(data: GameData, c0: CampaignState, spent: CampaignSim['spent']): CampaignState {
  let c = c0;
  const pay = (key: keyof CampaignSim['spent'], before: number) => (spent[key] += before - c.gold);
  for (const pair of Object.keys(c.supports)) c = tryCmd(data, c, { type: 'unlockSupport', pair });
  const strong = () =>
    [...c.roster].sort((a, b) => effectiveLevel(data, b) - effectiveLevel(data, a)).slice(0, data.balance.simulation.armySize);
  // promote (story 10.2, for story 11.27): with an ember spark the highest unit of level 10 or more rises on its first path
  for (;;) {
    const cand = [...c.roster]
      .filter((u) => promotionTargets(data, u.classId).length > 0 && !promoteError(data, c, u.id, promotionTargets(data, u.classId)[0]!))
      .sort((a, b) => b.level - a.level)[0];
    if (!cand) break;
    const next = tryCmd(data, c, { type: 'promote', unit: cand.id, classId: promotionTargets(data, cand.classId)[0]! });
    if (next === c) break;
    c = next;
  }
  // build rooms (story 10.1) while a scar and the cheapest weapon upgrade of the strongest units stay paid
  const nextUpgrade = Math.min(
    ...strong()
      .map((u) => c.roster.find((r) => r.id === u.id)?.equip.mainHand)
      .map((w) => (w && itemCategory(itemDef(data, w)) === 'weapon' ? (upgradeCost(data, w)?.gold ?? Infinity) : Infinity)),
  );
  c = buildRooms(data, c, Number.isFinite(nextUpgrade) ? nextUpgrade : 0, spent);
  // heal: scars first, they cost the most and weigh on every battle
  for (const u of strong()) {
    while ((c.roster.find((r) => r.id === u.id)?.scars.length ?? 0) > 0) {
      const g = c.gold;
      const next = tryCmd(data, c, { type: 'healScar', unit: u.id, index: 0 });
      if (next === c) break;
      c = next;
      pay('heal', g);
    }
  }
  // buy: the cheapest healing item in stock for each strong unit without one
  const stock = merchantStock(data, currentTier(data, c), actOf(c))
    .filter((id) => itemDef(data, id).use?.heal)
    .sort((a, b) => itemDef(data, a).price - itemDef(data, b).price);
  const healing = stock[0];
  if (healing) {
    for (const u of strong()) {
      const rec = c.roster.find((r) => r.id === u.id)!;
      if (rec.bag.some((i) => itemDef(data, i).use?.heal)) continue;
      const g = c.gold;
      const bought = tryCmd(data, c, { type: 'buy', item: healing });
      if (bought === c) break;
      c = bought;
      pay('buy', g);
      const inst = c.convoy.at(-1)!;
      c = tryCmd(data, c, { type: 'equip', unit: u.id, uid: inst.uid, slot: 'bag' });
    }
  }
  // upgrade: main-hand weapons of the strongest units, one level per pass, cheapest first
  for (let pass = 0; pass < 10; pass++) {
    const weapons = strong()
      .map((u) => c.roster.find((r) => r.id === u.id)?.equip.mainHand)
      .filter((i): i is NonNullable<typeof i> => !!i && itemCategory(itemDef(data, i)) === 'weapon')
      .sort((a, b) => (upgradeCost(data, a)?.gold ?? Infinity) - (upgradeCost(data, b)?.gold ?? Infinity));
    let any = false;
    for (const w of weapons) {
      const g = c.gold;
      const next = tryCmd(data, c, { type: 'upgrade', uid: w.uid });
      if (next === c) continue;
      c = next;
      pay('upgrade', g);
      any = true;
    }
    if (!any) break;
  }
  return c;
}

const sideGoldOf = (r: BattleResult): number => r.side.filter((s) => s.done).reduce((a, s) => a + (s.reward.gold ?? 0), 0);

/**
 * Story nodes of the act in a valid order: the first available story node not yet played (`availableNodes`); with `order`
 * (story 11.4) the listed nodes go first when several are open at once, so either mission of a pair can come first.
 */
function nextNode(data: GameData, c: CampaignState, order: string[] = []): string | undefined {
  // story 11.20: a side node named in `--order` is played too, as soon as it is open (e.g. N4 after 2-3 with Ilka in the company)
  const open = availableNodes(data, c).filter((n) => (n.kind === 'story' || order.includes(n.id)) && !c.completed.includes(n.id));
  return (order.map((id) => open.find((n) => n.id === id)).find(Boolean) ?? open[0])?.id;
}

/** `--flags a=b,c` → `{ a: 'b', c: true }` (a whole number becomes a number); every flag must be in the register, a value among its `values`. */
export function parseFlags(data: GameData, specs: string[] = []): Record<string, FlagValue> {
  const out: Record<string, FlagValue> = {};
  for (const spec of specs.flatMap((s) => s.split(',')).filter(Boolean)) {
    const [name, raw] = spec.split('=') as [string, string | undefined];
    const def = data.flags[name];
    if (!def) throw new Error(`--flags: no flag "${name}" in the register (flags.yaml)`);
    const value: FlagValue = raw === undefined ? true : /^-?\d+$/.test(raw) ? Number(raw) : raw;
    if (def.values && !def.values.includes(value as string | number)) throw new Error(`--flags: ${name} takes ${def.values.join(', ')}, got ${raw}`);
    out[name] = value;
  }
  return out;
}

/**
 * The data for a run aimed at act `o.act` (story 11.4): the acts up to it are open (`releasedActs`, the transition needs it),
 * `--map-file` adds its map (as `devMap` does) and stands in for the target node, `--position` moves `positionLevel.base` so the
 * target node stands on P = k in the order the runs play. Act 1 gets the data back unchanged. Pure apart from reading the map file.
 */
export function prepareActData(
  data: GameData,
  o: Pick<CampaignSimOptions, 'act' | 'position' | 'mapFile' | 'node' | 'order' | 'flags' | 'difficulty' | 'deathMode'>,
): GameData {
  const act = o.act ?? 1;
  if (act === 1) {
    if (o.position !== undefined || o.mapFile || o.node) throw new Error('--position, --map-file and --node need a later act (--campaign act2)');
    return data;
  }
  const head = data.acts[act];
  if (!head) throw new Error(`act ${act} is not loaded`);
  const d: GameData = { ...data, releasedActs: Array.from({ length: act }, (_, i) => i + 1), acts: { ...data.acts }, maps: { ...data.maps } };
  let nodes: CampaignNodeDef[] = head.nodes;
  const story = nodes.filter((n) => n.kind === 'story');
  // story 11.20: a side node may be the target too, it is played when `--order` names it
  const named = nodes.find((n) => n.id === o.node);
  if (o.node && (!named || (named.kind !== 'story' && !o.order?.includes(o.node))))
    throw new Error(`--node ${o.node} is no story node of act ${act} (${story.map((n) => n.id).join(', ')}); a side node needs --order ${o.node}`);
  let target = o.node ?? story.find((n) => !d.maps[n.map])?.id ?? story[0]?.id;
  if (o.mapFile) {
    const parsed = mapSchema.parse(parse(readFileSync(o.mapFile, 'utf8'))) as Omit<MapDef, 'act'>;
    d.maps[parsed.id] = { ...parsed, act } as MapDef;
    const own = nodes.find((n) => n.map === parsed.id);
    if (own) target = o.node ?? own.id;
    else nodes = nodes.map((n) => (n.id === target ? { ...n, map: parsed.id } : n));
  }
  d.acts[act] = { ...head, nodes };
  if (o.position !== undefined) {
    if (!head.positionLevel) throw new Error(`--position: act ${act} has no positionLevel`);
    // the story nodes of the act done before the target, in the order the runs play them
    const c = entryCampaign(d, 1, o);
    let done = 0;
    for (let id = nextNode(d, c, o.order); id && id !== target; id = nextNode(d, c, o.order)) {
      c.completed.push(id);
      done++;
    }
    const node = nodes.find((n) => n.id === target)!;
    d.acts[act] = { ...d.acts[act]!, positionLevel: { ...head.positionLevel, base: o.position - done - (node.levelBonus ?? 0) } };
  }
  return d;
}

/**
 * `--start expected` (story 11.4): a campaign at the start of act `o.act` without playing what comes before, like `devNode`: every
 * companion who joins at a node of an earlier act is in the company, those nodes are done with their rewards (castle, sparks), and
 * the move to the act follows from the finale. Gold comes from `simulation.startExpected`; the levels are raised by the caller.
 */
function entryCampaign(data: GameData, seed: number, o: Pick<CampaignSimOptions, 'act' | 'flags' | 'difficulty' | 'deathMode'>): CampaignState {
  const act = o.act ?? 1;
  const c = newCampaign(data, seed, { difficulty: o.difficulty, deathMode: o.deathMode }, { ...AVATAR });
  Object.assign(c.flags, parseFlags(data, o.flags));
  for (const ch of Object.values(data.chars)) if ((nodeAct(data, ch.joins) ?? act) < act) addToRoster(data, c, ch.id);
  for (let a = 1; a < act; a++)
    for (const n of data.acts[a]?.nodes ?? []) {
      c.completed.push(n.id);
      applyNodeRewards(data, c, n.id);
    }
  const gold = data.balance.simulation.startExpected[String(act)]?.gold;
  if (gold !== undefined) c.gold = gold;
  return c;
}

/** The first node a run from `c` plays (skipping the ones without a map), or undefined. Leaves `c` as it is. */
function firstPlayable(data: GameData, c0: CampaignState, order?: string[]): CampaignNodeDef | undefined {
  const c = { ...c0, completed: [...c0.completed] };
  for (let id = nextNode(data, c, order); id; id = nextNode(data, c, order)) {
    const n = findNode(data, id)!;
    if (data.maps[n.map]) return n;
    c.completed.push(id);
  }
  return undefined;
}

const emptySim = (): CampaignSim => ({
  missions: [],
  finished: 0,
  endGold: 0,
  endArmyLevel: 0,
  spent: { heal: 0, buy: 0, upgrade: 0, rooms: 0 },
  haunts: { played: 0, won: 0, gold: 0, fallen: 0 },
  entry: { runs: 0, armyLevel: 0, gold: 0 },
  skipped: {},
});

/**
 * A day goes by (the packet of `day`), then every haunt that is open is played once with the whole company, oldest first; a
 * lost haunt stays open (story 5.6). The home heuristic runs after each, as a player would visit the camp.
 */
function playHaunts(data: GameData, c0: CampaignState, day: number, stats: CampaignSim['haunts']): CampaignState {
  let c = tryCmd(data, c0, { type: 'advanceDay', day });
  for (const h of [...c.haunts]) {
    stats.played++;
    const { state } = autoplay(data, startBattle(data, createHauntBattle(data, c, h.id, c.roster.map((u) => u.id))).state);
    if (state.outcome !== 'victory') continue;
    const won = finishBattle(data, c, state);
    stats.won++;
    stats.gold += won.result.gold;
    stats.fallen += won.result.fallen.length;
    c = won.campaign;
  }
  return c;
}

export function simulateCampaign(data: GameData, o: CampaignSimOptions): CampaignSim {
  const missions = new Map<string, MissionSim>();
  const out = emptySim();
  const act = o.act ?? 1;
  if (o.start === 'expected' && act === 1) throw new Error('--start expected needs a later act (--campaign act2)');
  const flags = parseFlags(data, o.flags);
  for (let run = 0; run < o.runs; run++) {
    const seed = o.seed + run;
    let c: CampaignState;
    if (o.start === 'expected') {
      c = entryCampaign(data, seed, o);
      // everyone stands on P of the first mission the run plays, raised with the game's own level-up (as devNode)
      const first = firstPlayable(data, c, o.order);
      const level = first ? nodeLevel(data, c, first) : (positionNow(data, c) ?? 1);
      for (const u of c.roster) while (u.level < level) levelUp(data, u, c.rng);
    } else {
      c = newCampaign(data, seed, { difficulty: o.difficulty, deathMode: o.deathMode }, { ...AVATAR });
      Object.assign(c.flags, flags);
    }
    let finished = true;
    let day = 0;
    let played = 0;
    let entered = false;
    for (let id = nextNode(data, c, o.order); id; id = nextNode(data, c, o.order)) {
      if (!entered && act > 1 && actOf(c) >= act) {
        entered = true;
        out.entry.runs++;
        out.entry.armyLevel += armyLevel(data, c);
        out.entry.gold += c.gold;
      }
      const node = findNode(data, id)!;
      if (!data.maps[node.map]) {
        // a placeholder of a later act (story 11.3): counted as done so the sequence goes on, reported
        out.skipped[id] = (out.skipped[id] ?? 0) + 1;
        c.completed.push(id);
        applyNodeRewards(data, c, id);
        // story 11.20: whoever joins on that map joins here (Ilka at 2-3), so the side quests that need him can open
        for (const ch of Object.values(data.chars)) if (ch.joins === id) addToRoster(data, c, ch.id);
        continue;
      }
      if (o.maxMissions !== undefined && played++ >= o.maxMissions) {
        finished = false;
        break;
      }
      const m =
        missions.get(id) ??
        missions
          .set(id, {
            node: id, map: node.map, expectedLevel: nodeLevel(data, c, node), reached: 0, wins: 0, downs: 0, gold: 0, sideGold: 0, cleared: 0, armyLevel: 0, rooms: 0, deaths: 0,
            turns: 0, actions: 0, deployed: 0, phases: 0, phaseSingle: 0, phaseMarch: 0, phaseSingleMax: 0, phaseMarchMax: 0, phaseShown: 0, phaseShownMax: 0,
            winTurns: [], side: Object.fromEntries(data.maps[node.map]!.objectives.side.map((s) => [s.id, 0])),
          })
          .get(id)!;
      m.reached++;
      m.armyLevel += armyLevel(data, c);
      m.rooms += roomUpgrades(data, c);
      o.onMission?.(id, c, run);
      let won: { campaign: CampaignState; result: BattleResult } | null = null;
      for (let attempt = 0; attempt < MAX_ATTEMPTS && !won; attempt++) {
        // a restart plays the mission again with fresh luck (the battle RNG derives from the campaign seed; the real restart
        // keeps it, but a player plays differently). The campaign keeps its own seed afterwards.
        const from = attempt === 0 ? c : { ...c, seed: (c.seed + attempt * 104729) >>> 0 };
        const begun = beginBattle(data, from, id, from.roster.map((u) => u.id)).state;
        const { state, log, events } = autoplay(data, begun);
        if (attempt === 0) {
          if (state.outcome === 'victory') {
            m.wins++;
            m.turns += state.turn;
            m.winTurns.push(state.turn);
            m.actions += log.filter((cmd) => cmd.type === 'move' || cmd.type === 'act' || cmd.type === 'pursue').length;
            // the line-up at the start: a unit recruited during the battle does not count
            m.deployed += begun.units.filter((u) => u.team === 'player').length;
            const teams = new Map([...begun.units, ...state.units].map((u) => [u.uid, u.team]));
            for (const p of aiPhaseTimes(data, events, (uid) => teams.get(uid))) {
              m.phases++;
              m.phaseSingle += p.single;
              m.phaseMarch += p.march;
              m.phaseSingleMax = Math.max(m.phaseSingleMax, p.single);
              m.phaseMarchMax = Math.max(m.phaseMarchMax, p.march);
              m.phaseShown += p.shown;
              m.phaseShownMax = Math.max(m.phaseShownMax, p.shown);
            }
          }
          m.downs += state.stats.downs; // every fall to 0 HP, also the ones rescued later
        }
        if (state.outcome === 'victory') {
          won = finishBattle(data, from, state);
          applyNodeRewards(data, won.campaign, id);
          won.campaign.seed = c.seed;
        }
      }
      if (!won) {
        finished = false;
        break;
      }
      m.cleared++;
      m.gold += won.result.gold;
      m.sideGold += sideGoldOf(won.result);
      m.deaths += won.result.fallen.length;
      for (const so of won.result.side) if (so.done) m.side[so.id] = (m.side[so.id] ?? 0) + 1;
      c = homeHeuristic(data, won.campaign, out.spent);
      if (o.haunts) c = playHaunts(data, c, 1000 + day++, out.haunts);
    }
    if (finished) {
      out.finished++;
      out.endGold += c.gold;
      out.endArmyLevel += armyLevel(data, c);
    }
  }
  out.missions = [...missions.values()];
  return out;
}

/**
 * Sums simulations of consecutive runs (in run order) into one, exactly as one `simulateCampaign` over all of them would
 * (Testlabor S2: the worker threads play one run each). Missions keep the order in which the runs first reached them.
 */
export function mergeCampaignSims(parts: CampaignSim[]): CampaignSim {
  const out = emptySim();
  const missions = new Map<string, MissionSim>();
  const sumInto = <T extends object>(to: T, from: T) => {
    for (const k of Object.keys(from) as (keyof T)[]) if (typeof from[k] === 'number') (to[k] as number) = (to[k] as number) + (from[k] as number);
  };
  for (const p of parts) {
    out.finished += p.finished;
    out.endGold += p.endGold;
    out.endArmyLevel += p.endArmyLevel;
    sumInto(out.spent, p.spent);
    sumInto(out.haunts, p.haunts);
    sumInto(out.entry, p.entry);
    for (const [id, n] of Object.entries(p.skipped)) out.skipped[id] = (out.skipped[id] ?? 0) + n;
    for (const pm of p.missions) {
      const m = missions.get(pm.node);
      if (!m) {
        missions.set(pm.node, structuredClone(pm));
        continue;
      }
      for (const k of Object.keys(pm) as (keyof MissionSim)[]) {
        if (k === 'expectedLevel' || typeof pm[k] !== 'number') continue;
        (m[k] as number) = k.endsWith('Max') ? Math.max(m[k] as number, pm[k] as number) : (m[k] as number) + (pm[k] as number);
      }
      m.winTurns.push(...pm.winTurns);
      for (const [id, n] of Object.entries(pm.side)) m.side[id] = (m.side[id] ?? 0) + n;
    }
  }
  out.missions = [...missions.values()];
  return out;
}

/** Marks a mission outside the NFR12 corridor of the difficulty, the GDD gold curve or the expected army level. */
export function missionFlags(data: GameData, m: MissionSim, difficulty: Difficulty): MissionFlags {
  const sim = data.balance.simulation;
  const f: MissionFlags = {};
  const cor = sim.corridors[difficulty];
  const win = m.wins / Math.max(1, m.reached);
  const downs = m.downs / Math.max(1, m.reached);
  if (cor.winMin !== undefined && win < cor.winMin) f.win = 'low';
  if (cor.winMax !== undefined && win > cor.winMax) f.win = 'high';
  const countDowns = !sim.winOnly.includes(m.node);
  if (countDowns && cor.downsMin !== undefined && downs < cor.downsMin) f.downs = 'low';
  if (countDowns && cor.downsMax !== undefined && downs > cor.downsMax) f.downs = 'high';
  if (m.cleared) {
    // the gold curve of the node's own act (story 11.4: missions of act 2 against perAct['2'])
    const [lo, hi] = sim.gold.perNode[m.node] ?? sim.gold.perAct[String(nodeAct(data, m.node) ?? 1)] ?? [0, Infinity];
    const base = (m.gold - m.sideGold) / m.cleared;
    if (base < lo) f.gold = 'low';
    if (base > hi) f.gold = 'high';
    // side objectives: what the map offers on top, against the GDD share of the base reward
    const map = data.maps[m.map]!;
    const offered = map.objectives.side.reduce((a, s) => a + (s.reward.gold ?? 0), 0);
    const share = offered / Math.max(1, map.goldReward);
    if (offered > 0 && share < sim.gold.sideShare[0]) f.side = 'low';
    if (share > sim.gold.sideShare[1]) f.side = 'high';
  }
  const lvl = m.armyLevel / Math.max(1, m.reached);
  if (Math.abs(lvl - m.expectedLevel) > sim.levelTolerance) f.level = lvl < m.expectedLevel ? 'low' : 'high';
  return f;
}
