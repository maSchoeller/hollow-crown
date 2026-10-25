/**
 * pnpm sim <mapId> [--runs 50] [--seed 1] [--difficulty normal] [--death standard] [--fresh]
 * pnpm sim --campaign act1 [--runs 50] [--seed 1] [--difficulty normal] [--death standard] [--haunts]
 * KI gegen KI fürs Balancing (concept/10 §8). Die Spielerseite spielt autoCommand.
 * --campaign spielt den Akt verkettet mit Heimat-Heuristik und prüft Korridore und Goldkurve (Story 6.8, tools/simCampaign.ts).
 */
import { addToRoster, autoplay, beginBattle, finishBattle, newCampaign, type DeathMode, type Difficulty, type GameData } from '../src/core';
import { loadContentFromDisk } from '../src/content/node';
import { missionFlags, simulateCampaign, type MissionFlags } from './simCampaign';

const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1]! : def;
};
const { data } = loadContentFromDisk();
const campaignArg = args.includes('--campaign') ? opt('campaign', `act${data.campaign.act}`) : null;
if (campaignArg) {
  runCampaign(campaignArg);
  process.exit(0);
}
const mapId = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--')) ?? 'prologue_paktnacht';
const node = data.campaign.nodes.find((n) => n.map === mapId || n.id === mapId);
if (!node) throw new Error(`no campaign node for ${mapId}`);
const runs = Number(opt('runs', '50'));
const seed0 = Number(opt('seed', '1'));
const difficulty = opt('difficulty', 'normal') as Difficulty;
const deathMode = opt('death', 'standard') as DeathMode;

function campaignAt(d: GameData, seed: number, nodeId: string) {
  const c = newCampaign(d, seed, { difficulty, deathMode }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  // recruit chars who would have joined before this node
  const order = d.campaign.nodes.map((n) => n.id);
  const idx = order.indexOf(nodeId);
  for (const ch of Object.values(d.chars)) {
    const j = order.indexOf(ch.joins);
    if (j >= 0 && j < idx) addToRoster(d, c, ch.id);
  }
  c.completed = order.slice(0, idx);
  return c;
}

/** Plays the campaign up to the target node with autoplay so units carry their progression. */
function campaignChained(d: GameData, seed: number, nodeId: string) {
  let c = newCampaign(d, seed, { difficulty, deathMode }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  for (const n of d.campaign.nodes) {
    if (n.id === nodeId) return c;
    const { state } = autoplay(d, beginBattle(d, c, n.id, c.roster.map((u) => u.id)).state);
    if (state.outcome !== 'victory') return null;
    c = finishBattle(d, c, state).campaign;
  }
  return c;
}

const chained = !args.includes('--fresh');
let wins = 0;
let turns = 0;
let losses = 0;
let ms = 0;
let played = 0;
const causes: Record<string, number> = {};
const recruits: Record<string, number> = {};
let villages = 0;
for (let r = 0; r < runs; r++) {
  const c = chained ? campaignChained(data, seed0 + r, node.id) : campaignAt(data, seed0 + r, node.id);
  if (!c) continue;
  played++;
  const deploy = c.roster.map((u) => u.id);
  const t0 = performance.now();
  const start = beginBattle(data, c, node.id, deploy).state;
  const { state } = autoplay(data, start);
  ms += performance.now() - t0;
  if (state.outcome === 'victory') {
    wins++;
    turns += state.turn;
  }
  for (const u of state.units) if (u.team === 'player' && (u.gone === 'dead' || u.downed)) {
    losses++;
    causes[u.id] = (causes[u.id] ?? 0) + 1;
  }
  if (state.outcome !== 'victory') causes[`outcome:${state.outcome ?? 'timeout'}`] = (causes[`outcome:${state.outcome ?? 'timeout'}`] ?? 0) + 1;
  if (state.outcome === 'defeat') {
    const map = data.maps[state.mapId]!;
    for (const d of map.objectives.defeat) {
      const u = 'unit' in d ? state.units.find((x) => x.id === d.unit) : undefined;
      if (u && (u.downed || u.gone === 'dead')) causes[`lost:${u.id}`] = (causes[`lost:${u.id}`] ?? 0) + 1;
    }
  }
  villages += state.stats.villagesVisited.length;
  for (const r of state.stats.recruited) recruits[r] = (recruits[r] ?? 0) + 1;
}
console.log(`${node.id} (${mapId}) – ${played}/${runs} runs ${chained ? '(chained campaign)' : '(fresh roster)'}, ${difficulty}/${deathMode}`);
console.log(`win rate ${((wins / Math.max(1, played)) * 100).toFixed(0)} %, avg turns ${(turns / Math.max(1, wins)).toFixed(1)}, avg losses ${(losses / Math.max(1, played)).toFixed(2)}, avg ${(ms / Math.max(1, played)).toFixed(0)} ms/run`);
console.log('downs/deaths:', JSON.stringify(causes));
console.log(`villages/run ${(villages / Math.max(1, played)).toFixed(1)}, recruited: ${JSON.stringify(recruits)}`);

function runCampaign(act: string) {
  if (act !== `act${data.campaign.act}`) throw new Error(`content has ${`act${data.campaign.act}`}, not ${act}`);
  const runs = Number(opt('runs', '50'));
  const difficulty = opt('difficulty', 'normal') as Difficulty;
  const deathMode = opt('death', 'standard') as DeathMode;
  const haunts = args.includes('--haunts');
  const t0 = performance.now();
  const sim = simulateCampaign(data, { runs, seed: Number(opt('seed', '1')), difficulty, deathMode, haunts });
  const per = (n: number, d: number) => n / Math.max(1, d);
  const mark = (f: MissionFlags, k: keyof MissionFlags) => (f[k] ? (f[k] === 'low' ? ' ↓' : ' ↑') : '');
  console.log(`${act} chained – ${runs} runs, ${difficulty}/${deathMode}, ${((performance.now() - t0) / 1000).toFixed(1)} s`);
  if (haunts) console.log('haunts: not in the game yet (story 5.6), played without');
  const rows = sim.missions.map((m) => {
    const f = missionFlags(data, m, difficulty);
    return {
      mission: m.node,
      reached: m.reached,
      'win %': `${(per(m.wins, m.reached) * 100).toFixed(0)}${mark(f, 'win')}`,
      downs: `${per(m.downs, m.reached).toFixed(2)}${mark(f, 'downs')}`,
      gold: `${per(m.gold, m.cleared).toFixed(0)}${mark(f, 'gold')}`,
      'side gold': `${per(m.sideGold, m.cleared).toFixed(0)}${mark(f, 'side')}`,
      'army lv': `${per(m.armyLevel, m.reached).toFixed(1)}${mark(f, 'level')}`,
      expected: m.expectedLevel,
      deaths: per(m.deaths, m.cleared).toFixed(2),
      flagged: Object.keys(f).length ? Object.keys(f).join(',') : '',
    };
  });
  console.table(rows);
  console.log(
    `finished ${sim.finished}/${runs}, end gold ${per(sim.endGold, sim.finished).toFixed(0)}, end army lv ${per(sim.endArmyLevel, sim.finished).toFixed(1)}; ` +
      `home spent per run: heal ${per(sim.spent.heal, runs).toFixed(0)}, buy ${per(sim.spent.buy, runs).toFixed(0)}, upgrade ${per(sim.spent.upgrade, runs).toFixed(0)}`,
  );
  console.log('↓/↑ = below/above the NFR12 corridor, the GDD gold curve (gold without side objectives; side gold share of the map reward) or the expected army level');
}
