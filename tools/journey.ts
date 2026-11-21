/**
 * pnpm journey <save-export.json | bugreport.json | save-record.json> [--json <datei>] [--replay]
 * Zeigt den Spielverlauf eines Spielstands (concept/24-architecture §6.2b): je Kampfversuch eine Zeile (Knoten, Versuch, Ergebnis,
 * Runden, Armeestufe gegen erwartete Stufe, gewonnene Stufen, Gold des Kampfs, Lagerausgaben davor, Niederschläge, Gefallene,
 * Nebenziele), dann eine Übersicht (Stufen je Karte, ab welchem Kampf welche Armeestufe erreicht war, Lageraktionen).
 *   --json <datei>  schreibt Zeilen und Übersicht als JSON
 *   --replay        spielt jedes gespeicherte Kampf-Log mit dem Content dieses Checkouts nach und vergleicht Ausgang, Runden, Niederschläge
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { loadContentFromDisk } from '../src/content/node';
import { emptyHistory, type CampaignState } from '../src/core';
import { migrate, setMigrationRenames, type SaveRecord } from '../src/persistence/save';
import { readRenames } from './build/packs-plugin';
import { journeyRows, journeySummary, replayRecord } from './journeyCheck';

const args = process.argv.slice(2);
const jsonArg = args.indexOf('--json');
const file = args.find((a, i) => !a.startsWith('--') && (jsonArg < 0 || i !== jsonArg + 1));
if (!file) {
  console.error('usage: pnpm journey <save-export.json | bugreport.json> [--json <file>] [--replay]');
  process.exit(2);
}

/** The campaign of a save export, a bug report, a save record or a bare campaign state. */
function campaignOf(raw: Record<string, unknown>): CampaignState {
  if (raw.format === 'hollow-crown-bug-report') {
    const c = raw.campaign as CampaignState | null;
    if (!c) throw new Error('the bug report holds no campaign');
    return c;
  }
  const rec = (raw.format === 'hollow-crown-save' ? JSON.parse(raw.body as string) : raw) as SaveRecord & { roster?: unknown };
  if (rec.payload?.campaign) {
    setMigrationRenames(readRenames(process.cwd()));
    return migrate(rec).payload.campaign;
  }
  if (rec.roster) return rec as unknown as CampaignState;
  throw new Error(`${file} is neither a save export, a bug report nor a campaign`);
}

const campaign = campaignOf(JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>);
const history = campaign.history ?? emptyHistory('migrated');
const rows = journeyRows(history);
const summary = journeySummary(history);

const pad = (v: unknown, n: number) => String(v ?? '-').padEnd(n);
const sign = (x: number) => (x > 0 ? `+${x}` : String(x));
console.log(`== Play history: ${rows.length} battles${history.since === 'migrated' ? ' (recorded since the save moved to format 4; earlier play is missing)' : ''} ==`);
console.log(`${pad('#', 4)}${pad('node', 14)}${pad('try', 4)}${pad('result', 12)}${pad('rnd', 4)}${pad('army/exp', 11)}${pad('lv+', 5)}${pad('ep', 6)}${pad('gold', 7)}${pad('camp', 11)}${pad('downs', 6)}${pad('fallen', 14)}side`);
for (const r of rows) {
  const node = r.haunt ? `${r.node}/${r.haunt}` : r.node;
  const army = `${r.army.toFixed(1)}/${r.expected ?? '-'}`;
  const camp = r.campActions ? `${sign(r.campGold)} (${r.campActions})` : '-';
  const result = r.turnRestarts ? `${r.result}↻${r.turnRestarts}` : r.result;
  console.log(
    `${pad(r.n, 4)}${pad(node, 14)}${pad(r.attempt, 4)}${pad(result, 12)}${pad(r.rounds, 4)}${pad(army, 11)}${pad(sign(r.levels), 5)}${pad(r.ep, 6)}${pad(sign(r.gold), 7)}${pad(camp, 11)}${pad(r.downs, 6)}${pad(r.fallen.join(',') || '-', 14)}${r.side}`,
  );
}

console.log('\n== Summary ==');
console.log(`outcomes     ${Object.entries(summary.outcomes).map(([k, n]) => `${k} ${n}`).join(', ') || '-'}; round restarts ${summary.turnRestarts}`);
console.log('levels/map   ' + (Object.entries(summary.maps).map(([m, s]) => `${m} ${sign(s.levels)} (${s.victories}/${s.attempts} won, gold ${sign(s.gold)})`).join('; ') || '-'));
console.log('time to lvl  ' + (summary.timeToLevel.map((t) => `L${t.level}@#${t.battle}`).join(' ') || '-'));
console.log(`camp         spent ${summary.camp.spent}, gained ${summary.camp.gained}; ${Object.entries(summary.camp.actions).map(([k, n]) => `${k}×${n}`).join(', ') || 'no actions'}${summary.pendingCamp ? `; ${summary.pendingCamp} after the last battle` : ''}`);

const replays: Array<{ n: number; status: string; detail: string }> = [];
if (args.includes('--replay')) {
  const { data } = loadContentFromDisk();
  console.log('\n== Replay with this checkout ==');
  for (const b of history.battles) {
    let r;
    try {
      r = replayRecord(data, b);
    } catch (e) {
      r = { status: 'failed' as const, detail: e instanceof Error ? e.message : String(e) };
    }
    replays.push({ n: b.n, status: r.status, detail: r.detail });
    console.log(`#${String(b.n).padEnd(4)}${b.node.padEnd(12)}${r.status.toUpperCase().padEnd(10)}${r.detail}`);
  }
  if (replays.some((r) => r.status === 'failed' || r.status === 'diverged')) process.exitCode = 1;
}

if (jsonArg >= 0) {
  const out = args[jsonArg + 1];
  if (!out) throw new Error('--json needs a file');
  writeFileSync(out, JSON.stringify({ since: history.since, rows, summary, ...(replays.length ? { replays } : {}) }, null, 1) + '\n');
  console.log(`\nwritten ${out}`);
}
