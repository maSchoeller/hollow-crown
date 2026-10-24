/**
 * Vite plugin for content and asset packs (architecture §5.14, story 7.1).
 *
 * - `virtual:hc-pack/<id>`: all YAML of a released pack as one JSON module (keys `content/<path>`, like the old glob).
 * - `virtual:hc-packs`: the released packs, which pack holds which map and scene, and a dynamic import per pack
 *   other than core (so each becomes its own chunk).
 * - After the build: files of unreleased packs leave `dist`, and `dist/packs.json` lists every released pack with its
 *   files, hashes and sizes. `nonCorePaths()` tells the service worker config which files to keep out of the precache.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';
import { parse } from 'yaml';
import {
  CORE_PACK,
  groupByPack,
  packModuleId,
  packOf,
  parsePacks,
  type BuiltPack,
  type PackDef,
  type PackFile,
  type PacksManifest,
} from '../../src/content/packs.ts';

const INDEX_ID = 'virtual:hc-packs';
const PACK_PREFIX = packModuleId('');

const posix = (p: string): string => p.split(sep).join('/');

function walk(dir: string, out: string[] = [], root = dir): string[] {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out, root);
    else out.push(posix(relative(root, p)));
  }
  return out;
}

export const fileHash = (buf: Buffer | string): string => createHash('sha256').update(buf).digest('hex').slice(0, 16);

/** Reads and validates `content/packs.yaml`. */
export function readPacks(root: string): PackDef[] {
  return parsePacks(parse(readFileSync(join(root, 'content', 'packs.yaml'), 'utf8')));
}

/** Content YAML files (relative to content/) by pack id; `packs.yaml` itself belongs to none. */
export function contentByPack(root: string, packs: readonly PackDef[]): Map<string, string[]> {
  const files = walk(join(root, 'content')).filter((p) => /\.ya?ml$/.test(p) && p !== 'packs.yaml');
  return groupByPack(packs, files, 'content');
}

/** Builds the manifest entry of one pack from its files (paths relative to `dist`). */
export function builtPack(def: PackDef, files: PackFile[]): BuiltPack {
  const sorted = [...files].sort((a, b) => (a.path < b.path ? -1 : 1));
  return {
    id: def.id,
    load: def.load,
    act: def.act,
    ...(def.lang ? { lang: def.lang } : {}),
    budgetMb: def.budgetMb,
    hash: fileHash(sorted.map((f) => `${f.path}:${f.hash}`).join('\n')),
    bytes: sorted.reduce((n, f) => n + f.size, 0),
    files: sorted,
  };
}

export interface PacksPlugin extends Plugin {
  /** dist paths that belong to a pack other than core (filled after the build) */
  nonCorePaths(): ReadonlySet<string>;
}

export function packsPlugin(root = process.cwd()): PacksPlugin {
  let packs: PackDef[] = readPacks(root);
  let outDir = join(root, 'dist');
  const released = () => packs.filter((p) => p.released);
  /** emitted chunk file → pack id */
  const chunkPack = new Map<string, string>();
  let nonCore = new Set<string>();

  const contentModule = (id: string): string => {
    const files = contentByPack(root, packs).get(id) ?? [];
    const out: Record<string, unknown> = {};
    for (const f of files) out[`content/${f}`] = parse(readFileSync(join(root, 'content', f), 'utf8'));
    return `export default ${JSON.stringify(out)};`;
  };

  const indexModule = (): string => {
    const byPack = contentByPack(root, packs);
    const maps: Record<string, string> = {};
    const scenes: Record<string, string> = {};
    for (const p of released()) {
      for (const f of byPack.get(p.id) ?? []) {
        const id = /\/(maps|scenes)\/([^/]+)\.ya?ml$/.exec(f);
        if (id?.[1] === 'maps') maps[id[2]!] = p.id;
        if (id?.[1] === 'scenes') scenes[id[2]!] = p.id;
      }
    }
    const meta = released().map(({ id, load, act, lang, budgetMb }) => ({ id, load, act, ...(lang ? { lang } : {}), budgetMb }));
    const loaders = released()
      .filter((p) => p.id !== CORE_PACK)
      .map((p) => `  ${JSON.stringify(p.id)}: () => import(${JSON.stringify(packModuleId(p.id))}).then((m) => m.default),`)
      .join('\n');
    return [
      `export const packs = ${JSON.stringify(meta)};`,
      `export const contentIndex = ${JSON.stringify({ maps, scenes })};`,
      `export const loaders = {\n${loaders}\n};`,
    ].join('\n');
  };

  return {
    name: 'hc-packs',
    enforce: 'pre',
    nonCorePaths: () => nonCore,
    configResolved(config) {
      outDir = config.build.outDir.startsWith('/') || /^[A-Za-z]:/.test(config.build.outDir) ? config.build.outDir : join(config.root, config.build.outDir);
    },
    buildStart() {
      packs = readPacks(root);
      chunkPack.clear();
      this.addWatchFile(join(root, 'content', 'packs.yaml'));
    },
    resolveId(id) {
      if (id === INDEX_ID || id.startsWith(PACK_PREFIX)) return `\0${id}`;
      return null;
    },
    load(id) {
      if (!id.startsWith('\0')) return null;
      const name = id.slice(1);
      if (name === INDEX_ID) return indexModule();
      if (!name.startsWith(PACK_PREFIX)) return null;
      const packId = name.slice(PACK_PREFIX.length);
      const def = packs.find((p) => p.id === packId);
      if (!def?.released) this.error(`pack ${packId} is not released (content/packs.yaml)`);
      for (const f of contentByPack(root, packs).get(packId) ?? []) this.addWatchFile(join(root, 'content', f));
      return contentModule(packId);
    },
    generateBundle(_opts, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk' || !chunk.facadeModuleId?.startsWith(`\0${PACK_PREFIX}`)) continue;
        chunkPack.set(chunk.fileName, chunk.facadeModuleId.slice(1 + PACK_PREFIX.length));
      }
    },
    closeBundle: {
      // before vite-plugin-pwa writes the service worker, which reads `nonCorePaths()` and precaches packs.json
      order: 'pre',
      sequential: true,
      handler() {
        if (!existsSync(outDir)) return;
        const publicAssets = join(root, 'public', 'assets');
        const files = new Map<string, PackFile[]>(packs.map((p) => [p.id, []]));
        nonCore = new Set();
        for (const path of walk(outDir)) {
          if (path.endsWith('.map') || path === 'packs.json' || path === 'precache-info.json') continue;
          let def: PackDef = packs[0]!;
          const chunk = chunkPack.get(path);
          if (chunk) def = packs.find((p) => p.id === chunk)!;
          else if (path.startsWith('assets/') && existsSync(join(publicAssets, path.slice('assets/'.length)))) {
            def = packOf(packs, path.slice('assets/'.length), 'assets');
          }
          if (!def.released) {
            rmSync(join(outDir, path));
            continue;
          }
          const buf = readFileSync(join(outDir, path));
          files.get(def.id)!.push({ path, hash: fileHash(buf), size: buf.length });
          if (def.id !== CORE_PACK) nonCore.add(path);
        }
        const built = released().map((p) => builtPack(p, files.get(p.id)!));
        const manifest: PacksManifest = { version: fileHash(built.map((p) => `${p.id}:${p.hash}`).join('\n')), packs: built };
        writeFileSync(join(outDir, 'packs.json'), JSON.stringify(manifest));
      },
    },
  };
}
