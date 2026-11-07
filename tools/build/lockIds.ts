/**
 * The IDs `pnpm content:lock` locks (architecture §5.16, story 7.4): only those of packs with `released: true`. Maps and scenes are
 * files of their own; flags, lieutenants and characters are entries of list files (`acts/act<n>/flags.yaml`, `lieutenants.yaml`,
 * `units.yaml`), so an unreleased act pack (act 2 with its placeholder flags, story 11.10) adds nothing to the lock.
 */
import { readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { parse } from 'yaml';
import type { GameData } from '../../src/core/gameData';
import { collectIds, type IdSets } from '../../src/content/ids';
import type { PackDef } from '../../src/content/packs';
import { contentByPack } from './packs-plugin';

export function releasedIdSets(root: string, data: GameData, packs: readonly PackDef[]): { packs: string[]; ids: IdSets } {
  const released = packs.filter((p) => p.released).map((p) => p.id);
  const byPack = contentByPack(root, packs);
  const files = released.flatMap((id) => byPack.get(id) ?? []).map((f) => f.split(sep).join('/'));
  const inDir = (dir: string) => (id: string) => files.some((f) => f.endsWith(`/${dir}/${id}.yaml`) || f.endsWith(`/${dir}/${id}.yml`));
  const listed = (name: string) => {
    const ids = new Set<string>();
    for (const f of files.filter((x) => x === name || x.endsWith(`/${name}`))) {
      const list = parse(readFileSync(join(root, 'content', f), 'utf8')) as unknown;
      if (Array.isArray(list)) for (const e of list) if (e && typeof (e as { id?: unknown }).id === 'string') ids.add((e as { id: string }).id);
    }
    return (id: string) => ids.has(id);
  };
  return {
    packs: released,
    ids: collectIds(data, { maps: inDir('maps'), scenes: inDir('scenes'), flags: listed('flags.yaml'), lieutenants: listed('lieutenants.yaml'), chars: listed('units.yaml') }),
  };
}
