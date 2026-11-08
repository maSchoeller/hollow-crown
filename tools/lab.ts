/**
 * pnpm lab <szenario> [Abfrage …] – Testlabor M1 (concept/24-architecture/testlabor-2026-11-07.md): eine Kampflage aus einer
 * Szenario-YAML herstellen und befragen. <szenario> ist ein Name aus tests/fixtures/lab/ (`boss-gegenschlag`) oder ein Pfad.
 * Format der Datei: Kopf von src/lab/scenario.ts (Karte oder Fixture-Karte, Kompanie, Runde, Figuren mit Ort/TP/Stufe/Werten/Status/
 * Gegenständen, neue und entfernte Figuren, Feuer, Terrain, Seed).
 *
 * Ohne Abfrage: die Lage als Liste (Figuren mit Klasse, Stufe, TP, Ort, Status) und als Karte.
 *   --forecast <a> <b> [--from x,y]  Vorschau a greift b an (Formelcode des Spiels) und Auflösung über --seeds Seeds (Standard 200):
 *                                    wie oft fällt b, wie oft fällt a am Gegenschlag. Figuren per uid, id oder Charakter-id.
 *   --path <einheit> x,y             Weg der Wegsuche (reachable/pathTo), Kosten je Schritt, betretene brennende Felder, ob in dieser Runde
 *                                    (mehrfach möglich).
 *   --enemy                          spielt die Gegnerphase ab der Lage (endPhase) und zeigt, wer wohin zog und was es kostete.
 *   --play [--runs 20]               Autoplay beider Seiten bis zum Ende, Läufe mit Seeds seed … seed+runs−1.
 *   --json <datei>                   schreibt die Antworten maschinenlesbar.
 *   --set pfad=wert                  ändert balance.yaml nur für diesen Aufruf (wie bei pnpm sim).
 * Mehrere Abfragen in einem Aufruf sind erlaubt; alle rechnen von derselben Lage aus. Deterministisch: gleiche Datei, gleiche Antwort.
 *
 * Im Browser (Dev-Build): `await __hc.lab('boss-gegenschlag')` oder http://localhost:5173/hollow-crown/?lab=boss-gegenschlag
 * öffnet dieselbe Lage ohne Szenen; Speichern ist aus. In Vitest: `labState('boss-gegenschlag')` aus tests/fixtures/lab.ts.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { posKey, type BattleState, type BattleUnit, type GameData, type Pos } from '../src/core';
import { labFromFile } from '../src/lab/node';
import { labAttack, labEnemyPhase, labPath, labPlay } from '../src/lab/queries';
import { LabError } from '../src/lab/scenario';
import { loadContentWithSets, parseSets } from './simOverrides';

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const pct = (x: number) => `${Math.round(x * 100)} %`;
const tile = (p: Pos | null) => (p ? `${p[0]},${p[1]}` : '–');
const parsePos = (v: string | undefined, what: string): Pos => {
  const m = /^(\d+),(\d+)$/.exec(v ?? '');
  if (!m) throw new LabError(`${what} needs x,y, got "${v ?? ''}"`);
  return [Number(m[1]), Number(m[2])];
};

function describeUnit(u: BattleUnit): string {
  const status = u.status.length ? ` [${u.status.map((x) => `${x.id} ${x.turns}`).join(', ')}]` : '';
  const flags = `${u.boss ? ' Boss' : ''}${u.acted ? ' (hat gehandelt)' : ''}`;
  return `${u.team.padEnd(6)} ${u.uid.padEnd(14)} ${u.classId.padEnd(12)} Stufe ${String(u.level).padStart(2)}  TP ${String(u.hp).padStart(2)}  @${tile(u.pos)}${status}${flags}`;
}

/** The board as text: units by the first letter of their uid (players upper case), burning tiles `*`, terrain by its legend char. */
function board(data: GameData, s: BattleState): string {
  const at = new Map<string, BattleUnit>();
  for (const u of s.units) if (u.pos && !u.gone) at.set(posKey(u.pos), u);
  const legend = Object.entries(data.maps[s.mapId]!.legend ?? {});
  const ch = (t: string) => (t === 'burning' ? '*' : (legend.find(([, id]) => id === t)?.[0] ?? '?'));
  const rows: string[] = [`   ${Array.from({ length: s.width }, (_, x) => x % 10).join('')}`];
  for (let y = 0; y < s.height; y++) {
    let row = `${String(y).padStart(2)} `;
    for (let x = 0; x < s.width; x++) {
      const u = at.get(`${x},${y}`);
      row += u ? (u.team === 'player' ? u.uid[0]!.toUpperCase() : u.uid[0]!.toLowerCase()) : ch(s.terrain[y * s.width + x]!);
    }
    rows.push(row);
  }
  return rows.join('\n');
}

function main(): void {
  const ref = args[0];
  if (!ref || ref.startsWith('--')) {
    console.log('pnpm lab <szenario> [--forecast a b] [--path einheit x,y] [--enemy] [--play --runs 20] [--json datei]; Details im Kopf von tools/lab.ts');
    process.exit(1);
  }
  const data = loadContentWithSets(parseSets(args)).data;
  const { state: s, scenario } = labFromFile(data, ref);
  const out: Record<string, unknown> = { scenario: ref };
  console.log(`${ref}: Karte ${s.mapId}, Knoten ${s.nodeId}, Runde ${s.turn}, Seed ${scenario.seed}${scenario.question ? `\nFrage: ${scenario.question}` : ''}`);
  const queries = ['--forecast', '--path', '--enemy', '--play'].filter((q) => args.includes(q));

  if (!queries.length) {
    for (const u of s.units.filter((x) => x.pos && !x.gone)) console.log(`  ${describeUnit(u)}`);
    console.log(board(data, s));
  }

  if (args.includes('--forecast')) {
    const i = args.indexOf('--forecast');
    const [a, b] = [args[i + 1], args[i + 2]];
    if (!a || !b) throw new LabError('--forecast needs two units');
    const from = opt('--from') ? parsePos(opt('--from'), '--from') : undefined;
    const seeds = Number(opt('--seeds') ?? 200);
    const r = labAttack(data, s, a, b, { from, seeds });
    const f = r.forecast;
    const side = (x: typeof f.attacker) =>
      x.canStrike ? `${x.damage} Schaden × ${x.strikes}, Treffer ${x.hit} %, Krit ${x.crit} %` : 'kann nicht zuschlagen';
    console.log(`\nVorschau ${f.attacker.uid} → ${f.defender.uid} (Abstand ${f.distance}${from ? `, von ${tile(from)}` : ''}):`);
    console.log(`  ${f.attacker.uid}: TP ${f.attacker.hpBefore}/${f.attacker.maxHp}, ${side(f.attacker)}`);
    console.log(`  ${f.defender.uid} (Gegenschlag): TP ${f.defender.hpBefore}/${f.defender.maxHp}, ${side(f.defender)}`);
    console.log(`  Reihenfolge ${f.order.join(' ')}; wenn alles trifft: ${f.attacker.uid} ${f.attackerHpAfter} TP, ${f.defender.uid} ${f.defenderHpAfter} TP`);
    console.log(`  Aufgelöst über ${r.seeds} Seeds: ${f.defender.uid} fällt ${pct(r.targetFalls)}, ${f.attacker.uid} fällt am Gegenschlag ${pct(r.attackerFalls)}`);
    if (data.balance.combat.twoRnHit) console.log('  (Treffer wie angezeigt, gewürfelt mit 2RN: hohe Werte treffen öfter, niedrige seltener)');
    out.forecast = { forecast: f, targetFalls: r.targetFalls, attackerFalls: r.attackerFalls, seeds: r.seeds };
  }

  const paths: unknown[] = [];
  args.forEach((a, i) => {
    if (a !== '--path') return;
    const unit = args[i + 1];
    if (!unit) throw new LabError('--path needs a unit and x,y');
    const p = labPath(data, s, unit, parsePos(args[i + 2], '--path'));
    console.log(`
Weg ${p.unit} ${tile(p.from)} → ${tile(p.to)}:`);
    if (!p.path.length) console.log('  nicht erreichbar');
    else {
      console.log(`  ${p.path.map((x) => `${tile(x.pos)}${x.hazard ? '*' : ''}`).join(' → ')}`);
      console.log(`  Kosten ${p.cost} (Bewegung ${p.budget}: ${p.thisTurn ? 'in dieser Runde' : 'nicht in dieser Runde'}), Terrain ${p.path.slice(1).map((x) => x.terrain).join(' ')}`);
      console.log(`  Brennende Felder betreten: ${p.hazards.length ? p.hazards.map(tile).join(' ') : 'keine'}`);
    }
    paths.push(p);
  });
  if (paths.length) out.path = paths;

  if (args.includes('--enemy')) {
    const e = labEnemyPhase(data, s);
    console.log(`\nGegnerphase (Runde ${s.turn}) → jetzt Runde ${e.turn}${e.outcome ? `, Ausgang ${e.outcome}` : ''}:`);
    if (!e.changes.length) console.log('  niemand bewegt, niemand getroffen');
    for (const c of e.changes)
      console.log(`  ${c.team.padEnd(6)} ${c.uid.padEnd(14)} ${tile(c.from)} → ${tile(c.to)}  TP ${c.hpBefore} → ${c.hpAfter}${c.fell ? '  FÄLLT' : ''}`);
    out.enemy = { turn: e.turn, outcome: e.outcome, changes: e.changes };
  }

  if (args.includes('--play')) {
    const runs = Number(opt('--runs') ?? 20);
    const r = labPlay(data, s, runs, scenario.seed);
    const count = (o: string) => r.filter((x) => x.outcome === o).length;
    const turns = r.filter((x) => x.outcome === 'victory').map((x) => x.turns).sort((a, b) => a - b);
    console.log(`\nAutoplay ${runs} Läufe: Sieg ${count('victory')}, Niederlage ${count('defeat')}, Abbruch ${count('timeout')}`);
    if (turns.length) console.log(`  Runden der Siege: ${turns[0]}–${turns[turns.length - 1]}, Median ${turns[Math.floor(turns.length / 2)]}`);
    const fallen = new Map<string, number>();
    for (const x of r) for (const f of x.fallen) fallen.set(f, (fallen.get(f) ?? 0) + 1);
    if (fallen.size) console.log(`  Gefallen: ${[...fallen].map(([u, n]) => `${u} ${n}×`).join(', ')}`);
    const side = Object.keys(r[0]?.side ?? {});
    if (side.length) console.log(`  Nebenziele: ${side.map((id) => `${id} ${r.filter((x) => x.side[id]).length}/${runs}`).join(', ')}`);
    out.play = r;
  }

  const json = opt('--json');
  if (json) {
    mkdirSync(dirname(json), { recursive: true });
    writeFileSync(json, JSON.stringify(out, null, 2));
    console.log(`\nJSON: ${json}`);
  }
}

try {
  main();
} catch (e) {
  if (e instanceof LabError) {
    console.error(`lab: ${e.message}`);
    process.exit(1);
  }
  throw e;
}
