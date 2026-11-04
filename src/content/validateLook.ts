/** Checks of the board look (story 8.6): weather against the act of the map, status icons. Pure, called by validateContent. */
import type { GameData } from '../core/gameData';
import type { ContentIssue } from './load';
import { variantClassOf, variantList } from './propVariants';

/** A map's weather must be one that `render.yaml look.weather[..].acts` allows in the map's act (art-direction §2.5): an error. */
export function validateWeather(data: GameData): ContentIssue[] {
  const out: ContentIssue[] = [];
  for (const map of Object.values(data.maps)) {
    if (!map.weather) continue;
    const acts = data.render.look.weather[map.weather]?.acts;
    if (!acts) out.push({ file: `maps/${map.id}`, message: `unknown weather ${map.weather}` });
    else if (!acts.includes(map.act)) out.push({ file: `maps/${map.id}`, message: `weather ${map.weather} does not occur in act ${map.act} (allowed: act ${acts.join(', ')}; render.yaml look.weather)` });
  }
  return out;
}

/**
 * `propVariants` of a map (single fields set by hand): the field is on the map, its terrain carries a prop with variants
 * (house, lodge, rock, tree) and the model is one of that class's list in `render.yaml board.variants` (the trees of the map's act).
 */
export function validatePropVariants(data: GameData): ContentIssue[] {
  const out: ContentIssue[] = [];
  const v = data.render.board.variants;
  for (const [cls, lists] of Object.entries({ house: [v.house], lodge: [v.lodge], rock: [v.rock], tree: Object.values(v.tree) })) {
    for (const list of lists) {
      const seen = new Set<string>();
      for (const e of list) {
        if (seen.has(e.model)) out.push({ file: 'render.yaml', message: `board.variants.${cls}: model ${e.model} twice in one list` });
        seen.add(e.model);
      }
    }
  }
  for (const map of Object.values(data.maps)) {
    const rows = map.terrain.split(/\r?\n/).filter((r) => r.length > 0);
    for (const pv of map.propVariants ?? []) {
      const where = `maps/${map.id}`;
      const id = map.legend[rows[pv.at[1]]?.[pv.at[0]] ?? ''];
      if (!id) {
        out.push({ file: where, message: `propVariants ${pv.at}: not on the map` });
        continue;
      }
      const cls = variantClassOf(data.terrain[id]?.prop);
      if (!cls) {
        out.push({ file: where, message: `propVariants ${pv.at}: terrain ${id} carries no prop with variants (house, lodge, rock, tree)` });
        continue;
      }
      if (!variantList(data, cls, map.act).some((e) => e.model === pv.model)) {
        out.push({ file: where, message: `propVariants ${pv.at}: ${pv.model} is not a ${cls} variant of act ${map.act} (render.yaml board.variants.${cls}: ${variantList(data, cls, map.act).map((e) => e.model).join(', ')})` });
      }
    }
  }
  return out;
}

/** The statuses a unit can carry for a while and that therefore need an icon (knockback is never stored). */
export function iconStatuses(data: GameData): string[] {
  return [...new Set(Object.values(data.balance.element.statusOf))].filter((s) => s !== 'knockback').sort();
}

/** Every stored status needs `art/status/source/<id>.png`; `images` are the ids found there (undefined: not checked). */
export function validateStatusIcons(data: GameData, images?: Set<string>): ContentIssue[] {
  if (!images) return [];
  return iconStatuses(data)
    .filter((id) => !images.has(id))
    .map((id) => ({ file: 'balance.yaml', message: `status ${id}: no icon art/status/source/${id}.png` }));
}
