/**
 * pnpm sim:diff <a.json> <b.json> [--threshold 0.02] [--all]
 * Compares two outputs of `pnpm sim … --json <file>` (Testlabor S2) and lists only the values that moved: rates by more than
 * --threshold (absolute, default 0.02 = 2 points), other numbers by more than that share of the larger value. Missions are matched
 * by node, the corridor marks (↓/↑, campaign) are shown when they change. --all lists every value, `perRun` and `timing` stay out.
 */
import { readFileSync } from 'node:fs';

type Flat = Record<string, number | string>;

const SKIP = new Set(['perRun', 'timing', 'options', 'sets']);

/** Flattens numbers and the corridor flags into `a.b.c` keys; lists of objects with `node` or `id` are keyed by it. */
export function flatten(v: unknown, prefix = '', out: Flat = {}): Flat {
  if (typeof v === 'number') out[prefix] = v;
  else if (Array.isArray(v)) v.forEach((x, i) => flatten(x, `${prefix}.${(x as { node?: string; id?: string })?.node ?? (x as { id?: string })?.id ?? i}`, out));
  else if (v && typeof v === 'object')
    for (const [k, x] of Object.entries(v)) {
      if (SKIP.has(k)) continue;
      const key = prefix ? `${prefix}.${k}` : k;
      if (k === 'flags' && x && typeof x === 'object') out[key] = Object.entries(x).map(([f, d]) => `${f}${d === 'low' ? '↓' : '↑'}`).join(' ');
      else flatten(x, key, out);
    }
  return out;
}

export interface DiffRow {
  key: string;
  a: number | string | undefined;
  b: number | string | undefined;
  delta: string;
}

const isRate = (key: string) => /(rate|Rate|%)$/.test(key);

export function diffSims(a: unknown, b: unknown, threshold = 0.02, all = false): DiffRow[] {
  const fa = flatten(a);
  const fb = flatten(b);
  const rows: DiffRow[] = [];
  for (const key of [...new Set([...Object.keys(fa), ...Object.keys(fb)])]) {
    const x = fa[key];
    const y = fb[key];
    if (typeof x === 'number' && typeof y === 'number') {
      const d = y - x;
      const moved = isRate(key) ? Math.abs(d) > threshold : Math.abs(d) > threshold * Math.max(Math.abs(x), Math.abs(y));
      if (all || moved) rows.push({ key, a: round(x), b: round(y), delta: `${d > 0 ? '+' : ''}${isRate(key) ? `${(d * 100).toFixed(0)} pt` : round(d)}` });
    } else if (all || (x ?? '') !== (y ?? '')) rows.push({ key, a: x, b: y, delta: x === undefined ? 'new' : y === undefined ? 'gone' : 'changed' });
  }
  return rows;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

if (process.argv[1]?.replace(/\\/g, '/').endsWith('tools/simDiff.ts')) {
  const args = process.argv.slice(2);
  const files = args.filter((x, i) => !x.startsWith('--') && args[i - 1] !== '--threshold');
  if (files.length !== 2) throw new Error('usage: pnpm sim:diff <a.json> <b.json> [--threshold 0.02] [--all]');
  const ti = args.indexOf('--threshold');
  const threshold = ti >= 0 ? Number(args[ti + 1]) : 0.02;
  const [a, b] = files.map((f) => JSON.parse(readFileSync(f!, 'utf8')) as { kind?: string; sets?: unknown });
  if (a!.kind !== b!.kind) throw new Error(`cannot compare a ${a!.kind} run with a ${b!.kind} run`);
  console.log(`a ${files[0]} ${JSON.stringify(a!.sets ?? {})}\nb ${files[1]} ${JSON.stringify(b!.sets ?? {})}`);
  const rows = diffSims(a, b, threshold, args.includes('--all'));
  if (rows.length) console.table(rows);
  else console.log(`no value moved by more than ${threshold}`);
}
