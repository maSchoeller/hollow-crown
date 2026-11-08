/** Testlabor M1, Node side: reads a scenario and the fixture maps from disk for `pnpm lab` and the Vitest helper `labState`. */
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse } from 'yaml';
import type { GameData } from '../core';
import { buildLab, LabError, type FixtureMapSource, type LabResult } from './scenario';

/** Where the example scenarios live; `pnpm lab <name>` and `__hc.lab(name)` look here. */
export const LAB_DIR = 'tests/fixtures/lab';
const MAP_DIRS = ['tests/fixtures/maps', 'concept/27-ueberarbeitung/levels'];

/** A scenario name (`boss-gegenschlag`) or a path to a YAML file → the file's path. */
export function labFile(ref: string, root = process.cwd()): string {
  const direct = join(root, ref);
  if (/\.ya?ml$/.test(ref) && existsSync(direct)) return direct;
  const named = join(root, LAB_DIR, `${ref}.yaml`);
  if (existsSync(named)) return named;
  throw new LabError(`no lab scenario "${ref}" (looked for ${ref} and ${LAB_DIR}/${ref}.yaml)`);
}

export function fixtureMapsFromDisk(root = process.cwd()): FixtureMapSource {
  return (id) => {
    for (const dir of MAP_DIRS) {
      const f = join(root, dir, `${id}.yaml`);
      if (existsSync(f)) return parse(readFileSync(f, 'utf8'));
    }
    return undefined;
  };
}

/** Builds the battle of a scenario file (name or path). */
export function labFromFile(data: GameData, ref: string, root = process.cwd()): LabResult {
  const file = labFile(ref, root);
  return buildLab(data, parse(readFileSync(file, 'utf8')), fixtureMapsFromDisk(root), basename(file));
}
