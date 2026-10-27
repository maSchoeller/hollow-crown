/**
 * pnpm sim <mapId> [--runs 50] [--seed 1] [--difficulty normal] [--death standard] [--fresh] [--flag name=value]... [--leave id[,id]]
 * pnpm sim --haunt <mapId>:<variant> [--lt hask] [--runs 50] [--seed 1] [--difficulty normal] [--death standard]
 * pnpm sim --campaign act1 [--runs 50] [--seed 1] [--difficulty normal] [--death standard] [--haunts]
 * KI gegen KI fürs Balancing (concept/10 §8). Die Spielerseite spielt autoCommand.
 * --flag setzt vor dem Kampf ein Kampagnen-Flag (mehrfach möglich; Wert true, wenn nur der Name steht), --leave nimmt Begleiter aus der Truppe:
 *   so lassen sich die Zweige einer Entscheidung simulieren, z. B. Mission 1-4 mit „ausliefern“: `--flag e02=hand_over --leave fenn`
 *   (Einheiten mit `requires` auf der Karte hängen am Flag; ohne --flag gilt der Weg ohne Entscheidung = „schützen“).
 * --haunt spielt den Heimsuchungs-Anker einer Karte (Story 5.6) mit der verketteten Armee nach dieser Karte gegen den Leutnant --lt.
 * --campaign spielt den Akt verkettet mit Heimat-Heuristik und prüft Korridore und Goldkurve (Story 6.8, tools/simCampaign.ts).
 */
import { addToRoster, autoplay, beginBattle, createHauntBattle, finishBattle, hauntLevel, makeHaunt, newCampaign, seedRng, startBattle, storyNodeOf, type DeathMode, type Difficulty, type GameData } from '../src/core';
import { loadContentFromDisk } from '../src/content/node';
import { applyNodeRewards, missionFlags, simulateCampaign, type MissionFlags } from './simCampaign';

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
    applyNodeRewards(d, c, n.id);
  }
  return c;
}

if (args.includes('--haunt')) {
  runHaunt(opt('haunt', ''));
  process.exit(0);
}

const chained = !args.includes('--fresh');
const flagArgs = args.flatMap((a, i) => (a === '--flag' ? [args[i + 1]!] : []));
const leaveArgs = opt('leave', '').split(',').filter(Boolean);
let wins = 0;
let turns = 0;
const winTurns: number[] = [];
let losses = 0;
let ms = 0;
let played = 0;
const causes: Record<string, number> = {};
const recruits: Record<string, number> = {};
let villages = 0;
for (let r = 0; r < runs; r++) {
  const c = chained ? campaignChained(data, seed0 + r, node.id) : campaignAt(data, seed0 + r, node.id);
  if (!c) continue;
  for (const f of flagArgs) {
    const [name, value] = f.split('=');
    c.flags[name!] = value === undefined ? true : /^-?\d+$/.test(value) ? Number(value) : value;
  }
  c.roster = c.roster.filter((u) => !leaveArgs.includes(u.id));
  played++;
  const deploy = c.roster.map((u) => u.id);
  const t0 = performance.now();
  const start = beginBattle(data, c, node.id, deploy).state;
  const { state } = autoplay(data, start);
  ms += performance.now() - t0;
  if (state.outcome === 'victory') {
    wins++;
    turns += state.turn;
    winTurns.push(state.turn);
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
console.log(`win rate ${((wins / Math.max(1, played)) * 100).toFixed(0)} %, avg turns ${(turns / Math.max(1, wins)).toFixed(1)}, median turns ${[...winTurns].sort((a, b) => a - b)[Math.floor(winTurns.length / 2)] ?? '-'}, avg losses ${(losses / Math.max(1, played)).toFixed(2)}, avg ${(ms / Math.max(1, played)).toFixed(0)} ms/run`);
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
  if (haunts) {
    const h = sim.haunts;
    console.log(
      `haunts (one day per story mission, all open haunts played once): ${per(h.played, runs).toFixed(1)} per run, won ${(per(h.won, h.played) * 100).toFixed(0)} %, ` +
        `gold ${per(h.gold, runs).toFixed(0)} per run, fallen ${per(h.fallen, runs).toFixed(2)} per run`,
    );
  }
  console.log('↓/↑ = below/above the NFR12 corridor, the GDD gold curve (gold without side objectives; side gold share of the map reward) or the expected army level');
}

/**
 * Plays one haunt anchor (story 5.6): the army of the chained campaign after the anchor's story map (so at the level the
 * campaign has there) against the lieutenant `--lt`, `--runs` times; compares win rate and downs with the normal corridor.
 */
function runHaunt(spec: string) {
  const [mapId, variant] = spec.split(':');
  const map = data.maps[mapId ?? ''];
  const anchor = map?.haunts?.find((a) => a.variant === variant);
  const story = map && storyNodeOf(data, map.id);
  if (!map || !anchor || !story) throw new Error(`no haunt anchor ${spec} (use <mapId>:<variant>, e.g. prologue_paktnacht:rout)`);
  const ltId = opt('lt', 'hask');
  const lt = data.lieutenants[ltId];
  if (!lt) throw new Error(`unknown lieutenant ${ltId}`);
  const order = data.campaign.nodes.map((n) => n.id);
  // the army after the story node: the chain up to the node that follows it (or all of them)
  const after = order[order.indexOf(story.id) + 1];
  let wins = 0;
  let played = 0;
  let downs = 0;
  let fled = 0;
  const winTurns: number[] = [];
  const causes: Record<string, number> = {};
  let armyLevel = 0;
  let expected = 0;
  for (let r = 0; r < runs; r++) {
    const c = after ? campaignChained(data, seed0 + r, after) : campaignChained(data, seed0 + r, '');
    if (!c) continue;
    played++;
    c.lieutenants = { ...c.lieutenants, [ltId]: { met: true, encounters: 1, grudge: 0, routs: 0, signatureDropped: false, ...c.lieutenants?.[ltId] } };
    const h = makeHaunt(data, c, map, anchor, lt, 'sim', 1, seedRng(seed0 + r));
    if (!h) throw new Error('the spawn area holds no place for the lieutenant');
    c.haunts = [h];
    expected = hauntLevel(data, c);
    armyLevel += c.roster.length ? c.roster.reduce((a, u) => a + u.level, 0) / c.roster.length : 0;
    const start = createHauntBattle(data, c, h.id, c.roster.map((u) => u.id));
    const { state } = autoplay(data, startBattle(data, start).state);
    if (state.outcome === 'victory') {
      wins++;
      winTurns.push(state.turn);
    } else {
      const key = `outcome:${state.outcome ?? 'timeout'}${state.defeatReason ? `:${state.defeatReason}` : ''}`;
      causes[key] = (causes[key] ?? 0) + 1;
    }
    for (const u of state.units) if (u.team === 'player' && (u.gone === 'dead' || u.downed)) downs++;
    if (state.units.some((u) => u.lieutenant && u.gone === 'fled')) fled++;
  }
  const corridor = data.balance.simulation.corridors[difficulty];
  const win = wins / Math.max(1, played);
  const down = downs / Math.max(1, played);
  const inRange = (v: number, lo?: number, hi?: number) => (lo !== undefined && v < lo ? 'below' : hi !== undefined && v > hi ? 'above' : 'in');
  console.log(`haunt ${spec} vs ${ltId} – ${played}/${runs} runs (chained army after ${story.id}, avg level ${(armyLevel / Math.max(1, played)).toFixed(1)}, expected ${expected}), ${difficulty}/${deathMode}`);
  console.log(
    `win rate ${(win * 100).toFixed(0)} % (corridor ${corridor?.winMin ?? '-'}-${corridor?.winMax ?? '-'}: ${inRange(win, corridor?.winMin, corridor?.winMax)}), ` +
      `avg downs ${down.toFixed(2)} (corridor ${corridor?.downsMin ?? '-'}-${corridor?.downsMax ?? '-'}: ${inRange(down, corridor?.downsMin, corridor?.downsMax)}), ` +
      `median turns ${[...winTurns].sort((a, b) => a - b)[Math.floor(winTurns.length / 2)] ?? '-'}, lieutenant fled in ${fled} runs`,
  );
  if (Object.keys(causes).length) console.log('lost:', JSON.stringify(causes));
}
