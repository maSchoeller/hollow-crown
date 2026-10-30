/**
 * pnpm report <bugreport.json> [--last 200] [--all] [--no-replay]
 * Liest einen Fehlerbericht (concept/24-architecture §6.2a): Kopf (Versionen, Gerät, Grund, Notiz, Fehler), das Aktionsprotokoll
 * als Zeilen (Standard: die letzten 200, --all alle) und prüft das Replay mit dem Content dieses Checkouts:
 *   Kampf    Start + Commands gegen die Prüfsummen im Protokoll, bis zur ersten Abweichung
 *   Kampagne letzter Checkpoint + Journal gegen den Kampagnen-Zustand im Bericht
 * Für ein verlässliches Replay den Commit der App-Version auschecken (`appVersion` ist im Pages-Build der Commit, lokal 0.1.0); weicht die Content-Version ab, warnt es.
 */
import { readFileSync } from 'node:fs';
import { buildContent } from '../src/content/load';
import { loadContentFromDisk, readContentFiles } from '../src/content/node';
import { CORE_PACK } from '../src/content/packs';
import { contentByPack, readPacks } from './build/packs-plugin';
import { contentVersionOf } from '../src/persistence/save';
import type { BugReport } from '../src/app/report';
import { checkBattle, checkCampaign, describeEntry } from './reportCheck';

const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--last');
if (!file) {
  console.error('usage: pnpm report <bugreport.json> [--last 200] [--all] [--no-replay]');
  process.exit(2);
}
const lastArg = args.indexOf('--last');
const last = args.includes('--all') ? Infinity : lastArg >= 0 ? Number(args[lastArg + 1]) : 200;

const report = JSON.parse(readFileSync(file, 'utf8')) as Partial<BugReport>;
if (report.format !== 'hollow-crown-bug-report') {
  console.error(`${file} is not a Hollow Crown bug report`);
  process.exit(2);
}

const line = (label: string, value: unknown) => console.log(`${label.padEnd(12)} ${typeof value === 'string' ? value : JSON.stringify(value)}`);
console.log('== Bug report ==');
line('created', report.createdAt);
line('version', report.version ?? 1);
line('reason', report.reason ?? 'fault');
line('app', report.appVersion);
line('content', report.contentVersion);
line('device', report.device);
line('screen', report.screen ?? '-');
line('campaign', report.campaignId ?? '-');
if (report.note) line('note', report.note);
if (report.error) {
  line('error', `${report.error.name}${report.error.code ? ` ${report.error.code}` : ''}: ${report.error.message}`);
  if (report.error.details !== undefined) line('details', report.error.details);
}

const history = report.history ?? [];
if (history.length) {
  const counts = new Map<string, number>();
  for (const h of history) if (h.kind === 'command') counts.set(String(h.cmd.type), (counts.get(String(h.cmd.type)) ?? 0) + 1);
  console.log(`\n== Campaign history: ${history.length} journal entries ==`);
  for (const h of history) if (h.kind === 'checkpoint') console.log(`  #${h.seq} checkpoint ${h.reason} (app ${h.appVersion}, content ${h.contentVersion})`);
  console.log(`  commands: ${[...counts].map(([t, n]) => `${t}×${n}`).join(', ')}`);
}

const trail = report.trail ?? [];
console.log(`\n== Action trail: ${trail.length} entries${trail.length > last ? `, last ${last}` : ''} ==`);
let run = '';
for (const e of trail.slice(trail.length > last ? -last : 0)) {
  if (e.run !== run) {
    run = e.run;
    console.log(`-- app start ${e.run} (${e.t.slice(0, 10)}) --`);
  }
  console.log(describeEntry(e));
}

const warnings = (report.log ?? []).filter((l) => l.level === 'error' || l.level === 'warn');
if (warnings.length) {
  console.log(`\n== Log: ${warnings.length} warnings and errors ==`);
  for (const l of warnings.slice(-30)) console.log(`${l.t.slice(11, 19)} ${l.level.toUpperCase()} [${l.area}] ${l.msg}`);
}

if (!args.includes('--no-replay')) {
  const { data } = loadContentFromDisk();
  // the app's content version is the core pack's (computed before later packs register, src/app/state/session.ts)
  const files = readContentFiles();
  const core = new Set((contentByPack(process.cwd(), readPacks(process.cwd())).get(CORE_PACK) ?? []).map((f) => `content/${f}`));
  const local = contentVersionOf(buildContent(Object.fromEntries(Object.entries(files).filter(([k]) => core.has(k)))).data);
  console.log('\n== Replay with this checkout ==');
  if (local !== report.contentVersion) console.log(`WARNING content version ${local} here, ${report.contentVersion} in the report: results may differ`);
  const full = { trail, battle: null, checkpoint: null, journal: [], campaign: null, appVersion: '', ...report } as BugReport;
  for (const [name, check] of [
    ['battle', () => checkBattle(data, full)],
    ['campaign', () => checkCampaign(data, full)],
  ] as const) {
    let r;
    try {
      r = check();
    } catch (e) {
      r = { status: 'failed', detail: e instanceof Error ? e.message : String(e) };
    }
    console.log(`${name.padEnd(9)} ${r.status.toUpperCase()}  ${r.detail}`);
  }
}
