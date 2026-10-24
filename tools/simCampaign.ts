/**
 * Chained act simulation (story 6.8): plays the story missions of an act one after another with AI on both sides and a
 * simple home heuristic in between (heal scars, buy healing items, upgrade the strongest units' weapons), so gold, EP and
 * difficulty are checked across the whole act. Targets (NFR12 corridors, GDD gold curve) come from `balance.yaml` `simulation`.
 */
import {
  applyCampaign,
  autoplay,
  beginBattle,
  currentTier,
  effectiveLevel,
  finishBattle,
  itemCategory,
  itemDef,
  merchantStock,
  newCampaign,
  upgradeCost,
  validateCampaign,
  type BattleResult,
  type CampaignCommand,
  type CampaignState,
  type DeathMode,
  type Difficulty,
  type GameData,
} from '../src/core';

export interface CampaignSimOptions {
  runs: number;
  seed: number;
  difficulty: Difficulty;
  deathMode: DeathMode;
  /** haunts between missions; they do not exist yet (story 5.6), the flag is only reported */
  haunts?: boolean;
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
  /** player units downed or dead at the first attempt (corridor: per run) */
  downs: number;
  /** gold of the won attempt: everything, and the part from side objectives */
  gold: number;
  sideGold: number;
  /** runs that won the mission at all (restarts allowed) */
  cleared: number;
  /** effective army level (average of the strongest `armySize`) before the mission */
  armyLevel: number;
  /** companions lost for good in the won attempt */
  deaths: number;
}

export interface CampaignSim {
  missions: MissionSim[];
  /** runs that reached the end of the act */
  finished: number;
  /** gold and army level when the act ends (finished runs) */
  endGold: number;
  endArmyLevel: number;
  /** spent by the home heuristic over the act (all runs) */
  spent: { heal: number; buy: number; upgrade: number };
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

/** Between missions: unlock ready supports, heal scars, buy one healing item per strong unit, then upgrade weapons. */
export function homeHeuristic(data: GameData, c0: CampaignState, spent: CampaignSim['spent']): CampaignState {
  let c = c0;
  const pay = (key: keyof CampaignSim['spent'], before: number) => (spent[key] += before - c.gold);
  for (const pair of Object.keys(c.supports)) c = tryCmd(data, c, { type: 'unlockSupport', pair });
  const strong = () =>
    [...c.roster].sort((a, b) => effectiveLevel(data, b) - effectiveLevel(data, a)).slice(0, data.balance.simulation.armySize);
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
  const stock = merchantStock(data, currentTier(data, c))
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

/** Story nodes of the act in a valid order: the start, then always the first available node not yet played. */
function nextNode(data: GameData, c: CampaignState): string | undefined {
  if (!c.completed.length) return data.campaign.start;
  return c.available.find((id) => !c.completed.includes(id) && data.campaign.nodes.some((n) => n.id === id));
}

export function simulateCampaign(data: GameData, o: CampaignSimOptions): CampaignSim {
  const missions = new Map<string, MissionSim>();
  const out: CampaignSim = { missions: [], finished: 0, endGold: 0, endArmyLevel: 0, spent: { heal: 0, buy: 0, upgrade: 0 } };
  for (let run = 0; run < o.runs; run++) {
    const seed = o.seed + run;
    let c = newCampaign(data, seed, { difficulty: o.difficulty, deathMode: o.deathMode }, { ...AVATAR });
    let finished = true;
    for (let id = nextNode(data, c); id; id = nextNode(data, c)) {
      const node = data.campaign.nodes.find((n) => n.id === id)!;
      const m =
        missions.get(id) ??
        missions
          .set(id, { node: id, map: node.map, expectedLevel: node.expectedLevel, reached: 0, wins: 0, downs: 0, gold: 0, sideGold: 0, cleared: 0, armyLevel: 0, deaths: 0 })
          .get(id)!;
      m.reached++;
      m.armyLevel += armyLevel(data, c);
      let won: { campaign: CampaignState; result: BattleResult } | null = null;
      for (let attempt = 0; attempt < MAX_ATTEMPTS && !won; attempt++) {
        // a restart plays the mission again with fresh luck (the battle RNG derives from the campaign seed; the real restart
        // keeps it, but a player plays differently). The campaign keeps its own seed afterwards.
        const from = attempt === 0 ? c : { ...c, seed: (c.seed + attempt * 104729) >>> 0 };
        const { state } = autoplay(data, beginBattle(data, from, id, from.roster.map((u) => u.id)).state);
        if (attempt === 0) {
          if (state.outcome === 'victory') m.wins++;
          m.downs += state.units.filter((u) => u.team === 'player' && (u.downed || u.gone === 'dead')).length;
        }
        if (state.outcome === 'victory') {
          won = finishBattle(data, from, state);
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
      c = homeHeuristic(data, won.campaign, out.spent);
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

/** Marks a mission outside the NFR12 corridor of the difficulty, the GDD gold curve or the expected army level. */
export function missionFlags(data: GameData, m: MissionSim, difficulty: Difficulty): MissionFlags {
  const sim = data.balance.simulation;
  const f: MissionFlags = {};
  const cor = sim.corridors[difficulty];
  const win = m.wins / Math.max(1, m.reached);
  const downs = m.downs / Math.max(1, m.reached);
  if (cor.winMin !== undefined && win < cor.winMin) f.win = 'low';
  if (cor.winMax !== undefined && win > cor.winMax) f.win = 'high';
  if (cor.downsMin !== undefined && downs < cor.downsMin) f.downs = 'low';
  if (cor.downsMax !== undefined && downs > cor.downsMax) f.downs = 'high';
  if (m.cleared) {
    const [lo, hi] = sim.gold.perNode[m.node] ?? sim.gold.perAct[String(data.campaign.act)] ?? [0, Infinity];
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
