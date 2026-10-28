/**
 * The files the first mission (prologue) cannot start without, as paths relative to `dist` (posix style).
 *
 * The loading screen (`src/app/loading/plan.ts` `missionAssets`, fed by `flow.ts`) works from runtime data (GameData,
 * manifest.json), which does not exist at build time. This derives the same set from the content YAML instead:
 *  - the unit models (and their baked animation files, `.vat`) of every figure that joins at the opening node (`fixed: first`) or stands on its map (units and
 *    reinforcements; the avatar adds both avatar models),
 *  - the weapon and prop model libraries (`models/weapons`, `models/props` without the props that a later pack lists in packs.yaml; the plan picks only the weapons the units
 *    hold, here all of them: a few files more, and no dependency on item data),
 *  - the battle music pair.
 * Used by vite.config.ts (adds them to the precache, story 7.6) and tools/check-bundle-size.mjs (budget).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse } from 'yaml';

const ACT = 'acts/act1';

/** ids of the figures the opening mission needs */
export function firstMissionFigures(root = process.cwd()) {
  const content = (f) => parse(readFileSync(join(root, 'content', f), 'utf8'));
  const figures = new Set();
  const campaign = content(`${ACT}/campaign.yaml`);
  const start = campaign.nodes?.find((n) => n.fixed === 'first');
  if (!start) throw new Error('campaign.yaml has no node with fixed: first');
  for (const c of content(`${ACT}/units.yaml`)) {
    if (c.joins !== start.id) continue;
    figures.add(c.sprite ?? c.id);
    if (c.flags?.includes('avatar')) for (const p of ['avatar_a', 'avatar_b']) figures.add(p);
  }
  const map = content(`${ACT}/maps/${start.map}.yaml`);
  const mapUnits = [...(map?.units ?? []), ...(map?.reinforcements ?? []).flatMap((r) => r.units ?? [])];
  for (const u of mapUnits) figures.add(u.sprite ?? u.id ?? u.class);
  return figures;
}

/** Prop file stems that a pack other than core lists (`props` in content/packs.yaml): they are not part of the first download. */
let laterProps;
function laterPropStems(root = process.cwd()) {
  laterProps ??= new Set(
    (parse(readFileSync(join(root, 'content', 'packs.yaml'), 'utf8')).packs ?? [])
      .filter((p, i) => i > 0 && p.released)
      .flatMap((p) => p.props ?? []),
  );
  return laterProps;
}

/** @param {string[]} files all files of dist (posix paths relative to it) */
export function isFirstMissionFile(p, figures) {
  const prop = /^assets\/models\/props\/([^/]+)\.glb$/.exec(p);
  if (prop && laterPropStems().has(prop[1])) return false;
  if (/^assets\/models\/(props|weapons)\//.test(p) || /^assets\/audio\/battle_(player|enemy)\.mp3$/.test(p)) return true;
  const m = /^assets\/(?:[^/]+\/)?models\/units\/([^/]+)\.(?:glb|vat)$/.exec(p);
  return m !== null && figures.has(m[1]);
}

/** Files of a directory tree, posix paths relative to `base`. */
export function walkFiles(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walkFiles(p, base, out);
    else out.push(relative(base, p).split(sep).join('/'));
  }
  return out;
}

/** The first mission's files that exist in `outDir`. */
export function firstMissionFiles(outDir, root = process.cwd()) {
  const figures = firstMissionFigures(root);
  return walkFiles(outDir).filter((p) => isFirstMissionFile(p, figures));
}
