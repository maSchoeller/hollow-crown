/** Checks of the board look (story 8.6): weather against the act of the map, status icons. Pure, called by validateContent. */
import type { GameData } from '../core/gameData';
import type { ContentIssue } from './load';
import { variantClassOf, variantList } from './propVariants';
import { seasonOf } from './season';

/** Terrain props the board builds from pieces or names itself (walls, gates, boardwalks, the rock wall, the lever), not from `<prop>_idle`. */
const OWN_KIT = new Set(['bridge', 'gate', 'boardwalk', 'lever', 'paddock', 'paddock_gate', 'rope_bridge', 'quay']);

/** A map's weather must be one that `render.yaml look.weather[..].acts` allows in the map's act (art-direction §2.5): an error. */
export function validateWeather(data: GameData): ContentIssue[] {
  const out: ContentIssue[] = [];
  for (const map of Object.values(data.maps)) {
    if (!map.weather) continue;
    const acts = data.render.look.weather[map.weather]?.acts;
    if (!acts) out.push({ file: `maps/${map.id}`, message: `unknown weather ${map.weather}` });
    // snow falls wherever the board is in winter, also outside act 3 (N4 in act 2, story 15.15)
    else if (!acts.includes(map.act) && !(map.weather === 'snow' && seasonOf(data.render, map) === 'winter')) out.push({ file: `maps/${map.id}`, message: `weather ${map.weather} does not occur in act ${map.act} (allowed: act ${acts.join(', ')}; render.yaml look.weather)` });
  }
  return out;
}

/**
 * Seasons (story 15.15): every act a map lives in has a season in `render.yaml board.actSeason`, a map's own `season` is not set on an
 * interior (a place under a roof has none), and `board.seasonGround` only swaps the ground of surfaces that terrains draw, for a texture
 * that `tools/art/ground.py` builds (`groundTextures`, read by content:check; left out, the names are not checked).
 */
export function validateSeasons(data: GameData, groundTextures?: ReadonlySet<string>): ContentIssue[] {
  const out: ContentIssue[] = [];
  const board = data.render.board;
  for (const map of Object.values(data.maps)) {
    if (!board.actSeason[String(map.act)]) out.push({ file: 'render.yaml', message: `board.actSeason: no season for act ${map.act} (map ${map.id})` });
    if (map.season && map.interior) out.push({ file: `maps/${map.id}`, message: `season ${map.season} on an interior map: a place under a roof has no season` });
  }
  const surfaces = new Set<string>(Object.values(data.terrain).map((t) => t.surface));
  for (const [season, swap] of Object.entries(board.seasonGround))
    for (const [surface, texture] of Object.entries(swap ?? {})) {
      if (!surfaces.has(surface)) out.push({ file: 'render.yaml', message: `board.seasonGround.${season}: no terrain draws the surface ${surface}` });
      if (texture === surface) out.push({ file: 'render.yaml', message: `board.seasonGround.${season}.${surface}: swaps the texture for itself` });
      else if (groundTextures && !groundTextures.has(texture)) out.push({ file: 'render.yaml', message: `board.seasonGround.${season}.${surface}: ${texture} is no ground texture of tools/art/ground.py (TEXTURES)` });
    }
  return out;
}

/**
 * `propVariants` of a map (single fields set by hand): the field is on the map, its terrain carries a prop with variants
 * (house, lodge, rock, tree, field, relief, sarcophagus, stall, wagon, rockwall) and the model is one of that class's list in `render.yaml board.variants`
 * (the trees of the map's season); a weight-0 entry is exactly such a hand-placed model.
 */
export function validatePropVariants(data: GameData): ContentIssue[] {
  const out: ContentIssue[] = [];
  const v = data.render.board.variants;
  for (const [cls, lists] of Object.entries({ house: [v.house], lodge: [v.lodge], rock: [v.rock], field: [v.field], relief: [v.relief], stall: [v.stall], sarcophagus: [v.sarcophagus], wagon: [v.wagon], rockwall: [v.rockwall], tree: Object.values(v.tree), sceneryTree: Object.values(v.sceneryTree) })) {
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
        out.push({ file: where, message: `propVariants ${pv.at}: terrain ${id} carries no prop with variants (house, lodge, rock, tree, field, relief, sarcophagus, stall, wagon, rockwall)` });
        continue;
      }
      const season = seasonOf(data.render, map);
      const entry = variantList(data, cls, season).find((e) => e.model === pv.model);
      if (!entry) {
        out.push({ file: where, message: `propVariants ${pv.at}: ${pv.model} is not a ${cls} variant of ${season} (render.yaml board.variants.${cls}: ${variantList(data, cls, season).map((e) => e.model).join(', ')})` });
      } else if (entry.wide || entry.big) {
        // a two-field model covers its east neighbour, a 2 × 2 one also the south and south-east ones: the same terrain there, and no
        // model of their own set by hand
        const others: Array<[number, number]> = entry.big ? [[1, 0], [0, 1], [1, 1]] : [[1, 0]];
        const bad = others.some(([dx, dy]) => {
          const other = map.legend[rows[pv.at[1] + dy]?.[pv.at[0] + dx] ?? ''];
          const taken = (map.propVariants ?? []).some((o) => o.at[0] === pv.at[0] + dx && o.at[1] === pv.at[1] + dy);
          return other !== id || taken;
        });
        if (bad)
          out.push({
            file: where,
            message: entry.big
              ? `propVariants ${pv.at}: ${pv.model} is 2 × 2 fields and needs the east, south and south-east neighbours as ${id} without a model of their own`
              : `propVariants ${pv.at}: ${pv.model} is two fields wide and needs the east neighbour as ${id} without a model of its own`,
          });
      }
    }
  }
  return out;
}

/**
 * The prop models content names for the board (render.yaml `board.variants`, `decor`, `decorOn`, `propFallback`, and every map's
 * `propVariants`): each must be a file `art/models/props/<model>.glb` (`existing`) and must not be a gallery model the build leaves
 * out (`unshipped`: concept/23-art-direction/map-assets/groups without `ships`, tools/art/build.py), else the board draws nothing
 * there (story 15.8).
 */
export function validateBoardModels(data: Pick<GameData, 'render' | 'maps' | 'terrain'>, existing: ReadonlySet<string>, unshipped: ReadonlySet<string>): ContentIssue[] {
  const b = data.render.board;
  const named = new Map<string, string>();
  const name = (model: string, where: string) => {
    if (!named.has(model)) named.set(model, where);
  };
  for (const [cls, list] of Object.entries(b.variants)) {
    const lists = Array.isArray(list) ? [list] : Object.values(list);
    // a visitable house (lodge) hangs its object's state on the intact model: visited, razed (boardProps.ts withState)
    const states = (m: string) => (cls === 'lodge' && m.endsWith('_intact') ? ['intact', 'visited', 'razed'].map((s) => `${m.slice(0, -'intact'.length)}${s}`) : [m]);
    for (const l of lists) for (const e of l) for (const m of states(e.model)) name(m, `render.yaml board.variants.${cls}`);
  }
  // a terrain prop without variants and without a model kit of its own is drawn as `<prop>_idle` (boardProps.ts, default case)
  for (const t of Object.values(data.terrain)) if (t.prop && !variantClassOf(t.prop) && !OWN_KIT.has(t.prop)) name(`${t.prop}_idle`, `terrain.yaml ${t.id}`);
  for (const [k, d] of Object.entries(b.decor)) name(d.model, `render.yaml board.decor.${k}`);
  for (const [t, list] of Object.entries(b.decorOn)) for (const d of list) name(d.model, `render.yaml board.decorOn.${t}`);
  for (const m of Object.values(b.propFallback)) name(m, 'render.yaml board.propFallback');
  for (const [season, swap] of Object.entries(b.seasonModels)) for (const m of Object.values(swap ?? {})) name(m, `render.yaml board.seasonModels.${season}`);
  for (const map of Object.values(data.maps)) for (const pv of map.propVariants ?? []) name(pv.model, `maps/${map.id}`);
  const out: ContentIssue[] = [];
  for (const [model, file] of named) {
    if (!existing.has(model)) out.push({ file, message: `missing model ${model} (art/models/props/${model}.glb)` });
    else if (unshipped.has(model)) out.push({ file, message: `model ${model} is a gallery model without ships: true (concept/23-art-direction/map-assets/groups), the build leaves it out` });
  }
  return out;
}

/**
 * Gallery models the build leaves out (same rule as tools/art/build.py `unshipped_props`, keep both in step): every item of a
 * gallery group (concept/23-art-direction/map-assets/groups/*.yaml) unless the group or the item says `ships: true`.
 */
export function unshippedGalleryModels(groups: readonly unknown[]): Set<string> {
  const out = new Set<string>();
  for (const g of groups) {
    const group = (g ?? {}) as { ships?: boolean; items?: { id: string; ships?: boolean }[] };
    if (!group.ships) for (const it of group.items ?? []) if (!it.ships) out.add(it.id);
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
