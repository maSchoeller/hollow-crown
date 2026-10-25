/**
 * Global teardown of the performance run: joins test-results/perf/<device>.json into report.md (and the CI job summary),
 * with the values before story 7.7 from tests/perf/baseline.json next to them. `PERF_WRITE_BASELINE=1` writes the medians
 * of this run to baseline.json instead (only to record a new starting point; the file is a fixed reference).
 */
import { appendFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROFILE } from './profile';
import { isGpu, markdown, toBaseline, type Baseline, type DeviceReport } from './report';

export default function summary(): void {
  const dir = join(process.cwd(), 'test-results', 'perf');
  if (!existsSync(dir)) return;
  const reports = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as DeviceReport);
  if (!reports.length) return;
  const baselineFile = join(process.cwd(), 'tests', 'perf', 'baseline.json');
  const assets = existsSync(join(process.cwd(), 'public', 'assets', 'manifest.json')) ? 'mit Assets' : 'ohne Assets (Platzhalter-Figuren)';
  const gpu = reports.some((r) => isGpu(r.renderer));
  if (process.env.PERF_WRITE_BASELINE === '1') {
    const note = `Ausgangswerte vor Story 7.7 (Median, ${gpu ? 'GPU' : 'SwiftShader'}, Renderer ${reports[0]!.renderer}, erhoben ${new Date().toISOString().slice(0, 10)})`;
    writeFileSync(baselineFile, JSON.stringify(toBaseline(reports, note), null, 1) + '\n');
  }
  const baseline = existsSync(baselineFile) ? (JSON.parse(readFileSync(baselineFile, 'utf8')) as Baseline) : undefined;
  const levels = [...new Set(reports.flatMap((r) => r.stages.map((s) => `${s.cpuSlowdown}×`)))].join(', ');
  const note = `Profil: Gegnerphase bei CPU ${levels} gedrosselt (Ziel je Stufe in der Tabelle; Median der Läufe, Streuung der Ø FPS in Klammern; Thread-CPU = Hauptthread-Rechenzeit je gerendertem Frame), Kaltstart und Erstbesuch bei ${PROFILE.cpuSlowdown}×, Netz ${PROFILE.network.downloadKbps / 1000} Mbit/s, ${PROFILE.network.latencyMs} ms; Build ${assets}; Renderer je Gerät in der Tabelle (SwiftShader = Software-WebGL, keine GPU: FPS wird nur berichtet). Kaltstart = installierte App bis Titel; Erstbesuch = ohne Cache bis Titel (inkl. erstem Download).${baseline ? ` „vorher“ = ${baseline.note}.` : ''}`;
  const md = markdown(reports, note, baseline);
  writeFileSync(join(dir, 'report.md'), md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  console.log(md);
}
