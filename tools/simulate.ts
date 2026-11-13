/**
 * pnpm sim <mapId> [--runs 50] [--seed 1] [--difficulty normal] [--chain normal] [--death standard] [--fresh] [--flag name=value]... [--leave id[,id]]
 * --chain spielt die Missionen vor der Zielkarte auf einer anderen Stufe (Schwer-Ziel mit Normal-Kette, damit genug Läufe ankommen).
 * pnpm sim --haunt <mapId>:<variant> [--lt hask] [--runs 50] [--seed 1] [--difficulty normal] [--death standard]
 * pnpm sim --campaign act1 [--runs 50] [--seed 1] [--difficulty normal] [--death standard] [--haunts] [--action-s 12]
 * pnpm sim --campaign act2 [dieselben] [--start expected] [--position k] [--order m2_3,m2_6] [--flags e07=warn] [--map-file <pfad> [--node m2_4]]
 * KI gegen KI fürs Balancing (concept/10 §8). Die Spielerseite spielt autoCommand.
 * --flag setzt vor dem Kampf ein Kampagnen-Flag (mehrfach möglich; Wert true, wenn nur der Name steht), --leave nimmt Begleiter aus der Truppe:
 *   so lassen sich die Zweige einer Entscheidung simulieren, z. B. Mission 1-4 mit „ausliefern“: `--flag e02=hand_over --leave fenn`
 *   (Einheiten mit `requires` auf der Karte hängen am Flag; ohne --flag gilt der Weg ohne Entscheidung = „schützen“).
 * --promote a|b   lässt vor der Mission alle Figuren ab Stufe 10 auf den ersten (a) bzw. zweiten (b) Profi-Weg aufsteigen (Story 10.3).
 * --haunt spielt den Heimsuchungs-Anker einer Karte (Story 5.6) mit der verketteten Armee nach dieser Karte gegen den Leutnant --lt.
 *         Ein Leutnant eines späteren Akts (--lt rowena) spielt mit der Armee nach ganz Akt 1 in seinem Akt (Story 11.7).
 * --campaign spielt den Akt verkettet mit Heimat-Heuristik und prüft Korridore und Goldkurve (Story 6.8, tools/simCampaign.ts).
 * --campaign act2 (Story 11.4) spielt je Lauf Akt 1 bis zum Finale (dieselben Seeds wie act1), wechselt per Übergang in Akt 2
 *   und spielt dessen Folge. Knoten ohne gebaute Karte (Platzhalter) zählen als erledigt und stehen als „skipped“ im Bericht.
 *   Der Bericht nennt Armee-Stufe und Gold beim Eintritt (wenn der erste Knoten von Akt 2 ansteht, nach Lager und Heimsuchungen);
 *   die Goldkurve prüft die Missionen von Akt 2 gegen simulation.gold.perAct['2'].
 * --start expected  kein Akt-1-Lauf: die Truppe von Akt 1 (alle Akt-1-Knoten erledigt) steigt per Stufenaufstieg auf P der ersten
 *                   gespielten Mission; Gold aus simulation.startExpected['2'] in balance.yaml.
 * --position k      setzt P des Zielknotens (--node, sonst der Knoten von --map-file bzw. der erste Story-Knoten von Akt 2 ohne Karte)
 *                   auf k; die übrigen Knoten folgen (positionLevel.base wird nur für diesen Aufruf verschoben).
 * --order a,b       Reihenfolge innerhalb der Paare: sind mehrere Story-Knoten offen, kommen die genannten zuerst (sonst Dateireihenfolge).
 *                   Story 11.20: ein genannter Nebenquest-Knoten wird mitgespielt, sobald er offen ist (z. B. --order n4); wer auf einer
 *                   übersprungenen Karte beitritt (joins), kommt dort in die Truppe (Ilka bei 2-3).
 * --flags a=b,c     setzt Kampagnen-Flags zu Beginn jedes Laufs (Ausgang einer Entscheidung, z. B. --flags e07=warn für E7 „warnen“); ohne Wert = true,
 *                   der Name muss im Flag-Register stehen.
 * --map-file <pfad> spielt eine Karten-YAML (z. B. tests/fixtures/maps/dev_eisenmark.yaml) als Knoten von Akt 2: am Knoten mit ihrer
 *                   Karten-Id, sonst an --node (Standard: erster Story-Knoten ohne Karte). Akt 2 bleibt dabei unveröffentlicht.
 *
 * Testlabor S1/S2 (concept/24-architecture/testlabor-2026-11-07.md), für eine Karte und für --campaign:
 *   Die Ausgabe zeigt die Nebenziele (erfüllt nur bei Sieg; die KI verfolgt sie nicht, was sie nicht versucht, steht als 0 %)
 *   und die Runden der Siege als p10/p50/p90 samt Verteilung.
 * --json <datei>   schreibt alles maschinenlesbar (Karte: jeder Lauf mit seinen Nebenzielen in `perRun`), z. B. `--json .sim/base.json`.
 * --set pfad=wert  ändert balance.yaml nur für diesen Aufruf (mehrfach möglich), z. B. `--set experience.killBase=38`;
 *                  der Wert wird als YAML gelesen, der Pfad muss existieren, das Schema prüft das Ergebnis.
 * --workers n      verteilt die Läufe auf n Threads (Standard: Kerne − 1, höchstens einer je Lauf; 1 = seriell im Prozess).
 *                  Jeder Lauf hängt nur an seinem Seed (seed + Lauf), seriell und parallel ergeben dasselbe. --haunt läuft seriell.
 * pnpm sim:diff a.json b.json [--threshold 0.02] [--all] vergleicht zwei --json-Ausgaben (tools/simDiff.ts).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { autoplay, createHauntBattle, hauntLevel, makeHaunt, seedRng, startBattle, storyNodeOf, type DeathMode, type Difficulty } from '../src/core';
import { mergeCampaignSims, missionFlags, prepareActData, simulateCampaign, type CampaignSim, type MissionFlags } from './simCampaign';
import { campaignChained, printMap, simulateMapRun, summarizeMap, turnStats, type MapRun, type MapSimOptions } from './simMap';
import { loadContentWithSets, parseSets } from './simOverrides';
import { runParallel, workerCount } from './simPool';

const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1]! : def;
};
const sets = parseSets(args);
const { data } = loadContentWithSets(sets);
const jsonOut = args.includes('--json') ? opt('json', '') : null;
if (jsonOut === '' || jsonOut?.startsWith('--')) throw new Error('--json needs a file name');
const writeJson = (value: unknown) => {
  if (!jsonOut) return;
  mkdirSync(dirname(jsonOut), { recursive: true });
  writeFileSync(jsonOut, `${JSON.stringify(value, null, 2)}\n`);
  console.log(`json → ${jsonOut}`);
};
const workersArg = args.includes('--workers') ? opt('workers', '') : undefined;
const campaignArg = args.includes('--campaign') ? opt('campaign', 'act1') : null;
if (campaignArg) {
  await runCampaign(campaignArg);
  process.exit(0);
}
const mapId = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--')) ?? 'prologue_paktnacht';
const node = data.acts[1]!.nodes.find((n) => n.map === mapId || n.id === mapId);
if (!node) throw new Error(`no campaign node for ${mapId}`);
const runs = Number(opt('runs', '50'));
const seed0 = Number(opt('seed', '1'));
const difficulty = opt('difficulty', 'normal') as Difficulty;
const chainDifficulty = opt('chain', difficulty) as Difficulty;
const deathMode = opt('death', 'standard') as DeathMode;

if (args.includes('--haunt')) {
  runHaunt(opt('haunt', ''));
  process.exit(0);
}

const mapOptions: MapSimOptions = {
  node: node.id,
  difficulty,
  chainDifficulty,
  deathMode,
  chained: !args.includes('--fresh'),
  flags: args.flatMap((a, i) => (a === '--flag' ? [args[i + 1]!] : [])),
  leave: opt('leave', '').split(',').filter(Boolean),
  ...(args.includes('--promote') ? { promote: opt('promote', 'a') as 'a' | 'b' } : {}),
};
if (mapOptions.promote && !['a', 'b'].includes(mapOptions.promote)) throw new Error(`--promote takes a or b, got ${mapOptions.promote}`);
{
  const workers = workerCount(workersArg, runs);
  const t0 = performance.now();
  const results: MapRun[] =
    workers > 1
      ? await runParallel({ kind: 'map', options: mapOptions }, runs, seed0, workers, sets)
      : Array.from({ length: runs }, (_, r) => simulateMapRun(data, mapOptions, r, seed0 + r));
  const arrived = results.filter((r) => r.arrived);
  const timing = { msPerRun: arrived.reduce((a, r) => a + (r.ms ?? 0), 0) / Math.max(1, arrived.length), seconds: (performance.now() - t0) / 1000, workers };
  const summary = summarizeMap(data, { ...mapOptions, runs, seed: seed0 }, sets, results, timing);
  printMap(summary);
  writeJson(summary);
}

async function runCampaign(act: string) {
  const actNo = Number(/^act(\d+)$/.exec(act)?.[1]);
  if (!data.acts[actNo]) throw new Error(`content has ${Object.keys(data.acts).map((a) => `act${a}`).join(', ')}, not ${act}`);
  const runs = Number(opt('runs', '50'));
  const seed = Number(opt('seed', '1'));
  const difficulty = opt('difficulty', 'normal') as Difficulty;
  const deathMode = opt('death', 'standard') as DeathMode;
  const haunts = args.includes('--haunts');
  // story 11.4: the options of a later act, each only when given, so `--campaign act1` runs exactly as before
  const start = opt('start', 'chained');
  if (start !== 'chained' && start !== 'expected') throw new Error(`--start takes expected or chained, got ${start}`);
  const position = args.includes('--position') ? Number(opt('position', '')) : undefined;
  if (position !== undefined && !Number.isInteger(position)) throw new Error(`--position needs a whole number, got ${opt('position', '')}`);
  const list = (name: string) => (args.includes(`--${name}`) ? opt(name, '').split(',').filter(Boolean) : undefined);
  const order = list('order');
  const flags = list('flags');
  const acts = {
    ...(actNo > 1 ? { act: actNo } : {}),
    ...(start === 'expected' ? { start: 'expected' as const } : {}),
    ...(position !== undefined ? { position } : {}),
    ...(order ? { order } : {}),
    ...(flags ? { flags } : {}),
    ...(args.includes('--map-file') ? { mapFile: opt('map-file', '') } : {}),
    ...(args.includes('--node') ? { node: opt('node', '') } : {}),
  };
  const options = { difficulty, deathMode, haunts, ...acts };
  const actData = prepareActData(data, options);
  const workers = workerCount(workersArg, runs);
  const t0 = performance.now();
  const sim: CampaignSim =
    workers > 1
      ? mergeCampaignSims(await runParallel({ kind: 'campaign', options }, runs, seed, workers, sets))
      : simulateCampaign(actData, { runs, seed, ...options });
  const seconds = (performance.now() - t0) / 1000;
  const per = (n: number, d: number) => n / Math.max(1, d);
  const mark = (f: MissionFlags, k: keyof MissionFlags) => (f[k] ? (f[k] === 'low' ? ' ↓' : ' ↑') : '');
  console.log(`${act} ${start === 'expected' ? '(--start expected)' : 'chained'} – ${runs} runs, ${difficulty}/${deathMode}, ${seconds.toFixed(1)} s (${workers} worker${workers === 1 ? '' : 's'})`);
  const rows = sim.missions.map((m) => {
    const f = missionFlags(actData, m, difficulty);
    return {
      mission: m.node,
      reached: m.reached,
      'win %': `${(per(m.wins, m.reached) * 100).toFixed(0)}${mark(f, 'win')}`,
      downs: `${per(m.downs, m.reached).toFixed(2)}${mark(f, 'downs')}`,
      gold: `${per(m.gold, m.cleared).toFixed(0)}${mark(f, 'gold')}`,
      'side gold': `${per(m.sideGold, m.cleared).toFixed(0)}${mark(f, 'side')}`,
      'army lv': `${per(m.armyLevel, m.reached).toFixed(1)}${mark(f, 'level')}`,
      // story 10.1: room levels built above 1 before the mission (home heuristic)
      rooms: per(m.rooms, m.reached).toFixed(1),
      expected: m.expectedLevel,
      deaths: per(m.deaths, m.cleared).toFixed(2),
      flagged: Object.keys(f).length ? Object.keys(f).join(',') : '',
    };
  });
  console.table(rows);
  // story 15.10: rounds, player actions and the AI phases (tools/enemyPhase.ts) give an estimate of the battle time at tempo 1×
  // with „Gegnerzüge: Gemeinsam“; --action-s is the time a player needs for one unit action (select, move, preview, confirm)
  const actionS = Number(opt('action-s', '12'));
  if (!Number.isFinite(actionS) || actionS <= 0) throw new Error(`--action-s needs seconds > 0, got ${opt('action-s', '12')}`);
  let battleMin = 0;
  const times = sim.missions.map((m) => {
    // both parts per won first attempt; a mission no run won at the first attempt has no figure and stays out of the sum
    const min = (per(m.actions, m.wins) * actionS + per(m.phaseShown, m.wins) / 1000) / 60;
    if (m.wins) battleMin += min;
    return {
      mission: m.node,
      rounds: per(m.turns, m.wins).toFixed(1),
      deployed: per(m.deployed, m.wins).toFixed(1),
      actions: per(m.actions, m.wins).toFixed(0),
      'AI phase s (single/march/shown)': `${(per(m.phaseSingle, m.phases) / 1000).toFixed(1)} / ${(per(m.phaseMarch, m.phases) / 1000).toFixed(1)} / ${(per(m.phaseShown, m.phases) / 1000).toFixed(1)}`,
      'longest s (single/march/shown)': `${(m.phaseSingleMax / 1000).toFixed(1)} / ${(m.phaseMarchMax / 1000).toFixed(1)} / ${(m.phaseShownMax / 1000).toFixed(1)}`,
      'battle min': m.wins ? min.toFixed(0) : '-',
    };
  });
  console.table(times);
  console.log(`battle time of the act ≈ ${(battleMin / 60).toFixed(1)} h (${actionS} s per unit action, AI phases as shown with „Gemeinsam“, first attempts won)`);
  console.log(
    `finished ${sim.finished}/${runs}, end gold ${per(sim.endGold, sim.finished).toFixed(0)}, end army lv ${per(sim.endArmyLevel, sim.finished).toFixed(1)}; ` +
      `home spent per run: heal ${per(sim.spent.heal, runs).toFixed(0)}, buy ${per(sim.spent.buy, runs).toFixed(0)}, upgrade ${per(sim.spent.upgrade, runs).toFixed(0)}, rooms ${per(sim.spent.rooms, runs).toFixed(0)}`,
  );
  if (actNo > 1) {
    const e = sim.entry;
    console.log(
      `entry into ${act} (${start === 'expected' ? '--start expected' : 'chained after act 1'}${haunts ? ', with haunts' : ''}): ${e.runs}/${runs} runs, ` +
        `army lv ${per(e.armyLevel, e.runs).toFixed(2)}, gold ${per(e.gold, e.runs).toFixed(0)}`,
    );
  }
  const skipped = Object.entries(sim.skipped);
  if (skipped.length) console.log(`skipped, no playable map yet: ${skipped.map(([id, n]) => `${id} (${n} runs)`).join(', ')}`);
  if (haunts) {
    const h = sim.haunts;
    console.log(
      `haunts (one day per story mission, all open haunts played once): ${per(h.played, runs).toFixed(1)} per run, won ${(per(h.won, h.played) * 100).toFixed(0)} %, ` +
        `gold ${per(h.gold, runs).toFixed(0)} per run, fallen ${per(h.fallen, runs).toFixed(2)} per run`,
    );
  }
  console.log('↓/↑ = below/above the NFR12 corridor, the GDD gold curve (gold without side objectives; side gold share of the map reward) or the expected army level');
  // Testlabor S1: rounds of the first attempts won, side objectives of the won attempt (share of the runs that cleared the mission)
  console.table(
    sim.missions.map((m) => {
      const t = turnStats(m.winTurns);
      return {
        mission: m.node,
        'rounds p10/p50/p90': `${t.p10 ?? '-'}/${t.p50 ?? '-'}/${t.p90 ?? '-'}`,
        cleared: m.cleared,
        'side objectives': Object.entries(m.side)
          .map(([id, n]) => `${id} ${(per(n, m.cleared) * 100).toFixed(0)} %`)
          .join(', '),
      };
    }),
  );
  if (Object.keys(sets).length) console.log(`--set ${JSON.stringify(sets)}`);
  writeJson({
    kind: 'campaign',
    act,
    options: { runs, seed, difficulty, deathMode, haunts, actionS },
    sets,
    finished: sim.finished,
    finishRate: per(sim.finished, runs),
    endGold: per(sim.endGold, sim.finished),
    endArmyLevel: per(sim.endArmyLevel, sim.finished),
    spentPerRun: Object.fromEntries(Object.entries(sim.spent).map(([k, v]) => [k, per(v, runs)])),
    ...(haunts
      ? { haunts: { perRun: per(sim.haunts.played, runs), winRate: per(sim.haunts.won, sim.haunts.played), goldPerRun: per(sim.haunts.gold, runs), fallenPerRun: per(sim.haunts.fallen, runs) } }
      : {}),
    ...(actNo > 1
      ? { acts, entry: { runs: sim.entry.runs, armyLevel: per(sim.entry.armyLevel, sim.entry.runs), gold: per(sim.entry.gold, sim.entry.runs) }, skipped: sim.skipped }
      : {}),
    battleHours: battleMin / 60,
    missions: sim.missions.map((m) => ({
      node: m.node,
      map: m.map,
      reached: m.reached,
      cleared: m.cleared,
      winRate: per(m.wins, m.reached),
      downs: per(m.downs, m.reached),
      gold: per(m.gold, m.cleared),
      sideGold: per(m.sideGold, m.cleared),
      armyLevel: per(m.armyLevel, m.reached),
      rooms: per(m.rooms, m.reached),
      expectedLevel: m.expectedLevel,
      deaths: per(m.deaths, m.cleared),
      rounds: per(m.turns, m.wins),
      turns: turnStats(m.winTurns),
      actions: per(m.actions, m.wins),
      side: Object.fromEntries(Object.entries(m.side).map(([id, n]) => [id, { done: n, rate: per(n, m.cleared) }])),
      flags: missionFlags(actData, m, difficulty),
    })),
    timing: { seconds, workers },
  });
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
  if (!map || !anchor || !story) throw new Error(`no haunt anchor ${spec} (use <mapId>:<variant>, e.g. m1_1_steckbriefe:boss)`);
  const ltId = opt('lt', 'hask');
  const lt = data.lieutenants[ltId];
  if (!lt) throw new Error(`unknown lieutenant ${ltId}`);
  const order = data.acts[1]!.nodes.map((n) => n.id);
  // the army after the story node: the chain up to the node that follows it (or all of them)
  // story 11.7: a lieutenant of a later act haunts with the army after the whole of act 1, in his act (season, pools, level cap)
  const after = lt.act > 1 ? undefined : order[order.indexOf(story.id) + 1];
  let wins = 0;
  let played = 0;
  let downs = 0;
  let fled = 0;
  const winTurns: number[] = [];
  const causes: Record<string, number> = {};
  let armyLevel = 0;
  let expected = 0;
  for (let r = 0; r < runs; r++) {
    const c = campaignChained(data, seed0 + r, after ?? '', difficulty, chainDifficulty, deathMode);
    if (!c) continue;
    played++;
    if (lt.act > 1) c.act = lt.act;
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
    downs += state.stats.downs;
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
