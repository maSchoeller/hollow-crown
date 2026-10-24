/** Node-side content loading for CLI tools and tests (reads content/ from disk). */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { buildContent, type LoadedContent } from './load';

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.ya?ml$/.test(f)) out.push(p);
  }
  return out;
}

/** Content YAML files relative to content/, without `packs.yaml` (which describes the files, story 7.1). */
export function contentFiles(root = process.cwd()): string[] {
  const dir = join(root, 'content');
  return walk(dir)
    .map((p) => relative(dir, p).split('\\').join('/'))
    .filter((p) => p !== 'packs.yaml');
}

export function loadContentFromDisk(root = process.cwd()): LoadedContent {
  const dir = join(root, 'content');
  const files: Record<string, unknown> = {};
  for (const p of walk(dir)) if (!p.endsWith('packs.yaml')) files[`content/${relative(dir, p).split('\\').join('/')}`] = parse(readFileSync(p, 'utf8'));
  return buildContent(files);
}
