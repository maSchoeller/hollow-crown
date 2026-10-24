/** Global teardown of the performance run: joins test-results/perf/<device>.json into report.md (and the CI job summary). */
import { appendFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROFILE } from './profile';
import { markdown, type DeviceReport } from './report';

export default function summary(): void {
  const dir = join(process.cwd(), 'test-results', 'perf');
  if (!existsSync(dir)) return;
  const reports = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as DeviceReport);
  if (!reports.length) return;
  const assets = existsSync(join(process.cwd(), 'public', 'assets', 'manifest.json')) ? 'mit Assets' : 'ohne Assets (Platzhalter-Figuren)';
  const note = `Profil: CPU ${PROFILE.cpuSlowdown}× gedrosselt, Netz ${PROFILE.network.downloadKbps / 1000} Mbit/s, ${PROFILE.network.latencyMs} ms; Build ${assets}; Renderer je Gerät in der Tabelle (SwiftShader = Software-WebGL, keine GPU). Kaltstart = installierte App bis Titel; Erstbesuch = ohne Cache bis Titel (inkl. erstem Download).`;
  const md = markdown(reports, note);
  writeFileSync(join(dir, 'report.md'), md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  console.log(md);
}
