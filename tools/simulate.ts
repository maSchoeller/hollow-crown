/**
 * pnpm sim <mapId> [--runs 50] [--seed 1] [--difficulty normal] [--death standard]
 * KI gegen KI fürs Balancing (concept/10 §8). Die Spielerseite spielt autoCommand.
 */
import { addToRoster, autoplay, beginBattle, finishBattle, newCampaign, type DeathMode, type Difficulty, type GameData } from '../src/core';
import { loadContentFromDisk } from '../src/content/node';

const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1]! : def;
};
const { data } = loadContentFromDisk();
const mapId = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--')) ?? 'prologue_caravan';
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
}
console.log(`${node.id} (${mapId}) – ${played}/${runs} runs ${chained ? '(chained campaign)' : '(fresh roster)'}, ${difficulty}/${deathMode}`);
console.log(`win rate ${((wins / Math.max(1, played)) * 100).toFixed(0)} %, avg turns ${(turns / Math.max(1, wins)).toFixed(1)}, avg losses ${(losses / Math.max(1, played)).toFixed(2)}, avg ${(ms / Math.max(1, played)).toFixed(0)} ms/run`);
console.log('downs/deaths:', causes);
