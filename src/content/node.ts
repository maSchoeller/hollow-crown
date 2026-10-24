/** Node-side content loading for CLI tools and tests (reads content/ from disk). */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { buildContent, type LoadedContent } from './load';
import { META_FILES } from './packs';

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.ya?ml$/.test(f)) out.push(p);
  }
  return out;
}

/** Content YAML files relative to content/, without the files that describe them (`META_FILES`, stories 7.1 and 7.4). */
export function contentFiles(root = process.cwd()): string[] {
  const dir = join(root, 'content');
  return walk(dir)
    .map((p) => relative(dir, p).split('\\').join('/'))
    .filter((p) => !META_FILES.includes(p));
}

/** The parsed YAML documents of content/, keyed like the browser loader (`content/<path>`). */
export function readContentFiles(root = process.cwd()): Record<string, unknown> {
  const dir = join(root, 'content');
  const files: Record<string, unknown> = {};
  for (const rel of contentFiles(root)) files[`content/${rel}`] = parse(readFileSync(join(dir, rel), 'utf8'));
  return files;
}

export function loadContentFromDisk(root = process.cwd()): LoadedContent {
  return buildContent(readContentFiles(root));
}
