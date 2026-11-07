/**
 * `--set path=value` for the simulation (Testlabor S2): changes values of `content/core/balance.yaml` for one run of the tool,
 * without touching the file. The change goes into the parsed YAML before `buildContent`, so the schema checks it like a real edit.
 */
import { parse } from 'yaml';
import { buildContent, type LoadedContent } from '../src/content/load';
import { readContentFiles } from '../src/content/node';

const BALANCE = 'content/core/balance.yaml';

/** `--set a.b=1 --set c=[1,2]` → `{ 'a.b': 1, c: [1, 2] }`; the value is read as YAML (number, boolean, list, text). */
export function parseSets(args: string[]): Record<string, unknown> {
  const sets: Record<string, unknown> = {};
  args.forEach((a, i) => {
    if (a !== '--set') return;
    const spec = args[i + 1] ?? '';
    const eq = spec.indexOf('=');
    if (eq <= 0) throw new Error(`--set needs path=value, got "${spec}"`);
    sets[spec.slice(0, eq)] = parse(spec.slice(eq + 1));
  });
  return sets;
}

/** Writes the values into a parsed balance document; a path that does not exist there is an error (a typo would change nothing). */
export function applySets(balance: unknown, sets: Record<string, unknown>): void {
  for (const [path, value] of Object.entries(sets)) {
    const keys = path.split('.');
    let node = balance as Record<string, unknown>;
    for (const [i, k] of keys.entries()) {
      if (node === null || typeof node !== 'object' || !(k in node)) throw new Error(`--set ${path}: balance.yaml has no "${keys.slice(0, i + 1).join('.')}"`);
      if (i === keys.length - 1) node[k] = value;
      else node = node[k] as Record<string, unknown>;
    }
  }
}

/** Loads the content from disk with the `--set` values in balance.yaml; fails if the changed balance does not pass the schema. */
export function loadContentWithSets(sets: Record<string, unknown>, root = process.cwd()): LoadedContent {
  const files = readContentFiles(root);
  if (!Object.keys(sets).length) return buildContent(files);
  applySets(files[BALANCE], sets);
  const loaded = buildContent(files);
  const bad = loaded.issues.filter((i) => i.file.includes('balance'));
  if (bad.length) throw new Error(`--set breaks balance.yaml: ${bad.map((i) => i.message).join('; ')}`);
  return loaded;
}
