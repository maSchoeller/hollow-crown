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

/**
 * Parsed documents per file, kept for the life of the process (story 15.11): parsing the YAML is most of the time of a content load
 * (about 0.9 of 1.2 s), and the tests load the content again and again. A file is parsed anew when its size or time stamp changed.
 */
const parsed = new Map<string, { stamp: string; doc: unknown }>();

/** The parsed YAML documents of content/, keyed like the browser loader (`content/<path>`); each call returns its own copy. */
export function readContentFiles(root = process.cwd()): Record<string, unknown> {
  const dir = join(root, 'content');
  const files: Record<string, unknown> = {};
  for (const rel of contentFiles(root)) {
    const path = join(dir, rel);
    const st = statSync(path);
    const stamp = `${st.size}:${st.mtimeMs}`;
    let hit = parsed.get(path);
    if (hit?.stamp !== stamp) {
      hit = { stamp, doc: parse(readFileSync(path, 'utf8')) };
      parsed.set(path, hit);
    }
    // callers may change what they get (tests build broken content from it), so the kept document stays untouched
    files[`content/${rel}`] = structuredClone(hit.doc);
  }
  return files;
}

export function loadContentFromDisk(root = process.cwd()): LoadedContent {
  return buildContent(readContentFiles(root));
}
