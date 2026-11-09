/**
 * The season of a battle board (story 15.15, art-direction §2.4, `concept/23-art-direction/map-assets/jahreszeiten-plan.md`): the map's own
 * `season`, else that of its act (render.yaml `board.actSeason`), else summer. Pure and shared by the board (render) and `content:check`.
 * The rules never read it.
 */
import type { Season } from '../core/defs';
import type { MapDef } from '../core/mapDefs';
import type { RenderDef } from '../core/renderDefs';

export function seasonOf(render: Pick<RenderDef, 'board'>, map: Pick<MapDef, 'act' | 'season'>): Season {
  return map.season ?? render.board.actSeason[String(map.act)] ?? 'summer';
}

/**
 * Story 11.7: the act a battle board takes its season from is the campaign's (`BattleState.act`, left out in act 1), not the folder
 * of the map, so a haunt of act 2 on a map of act 1 shows autumn. The map's own `season` still wins (N4 with snow).
 */
export const boardAct = (s: { act?: number }): number => s.act ?? 1;

/** The season of a battle board: the map's own, else that of the campaign's act (`boardAct`), else summer. */
export function battleSeason(render: Pick<RenderDef, 'board'>, map: Pick<MapDef, 'season'>, s: { act?: number }): Season {
  return seasonOf(render, { season: map.season, act: boardAct(s) });
}

/**
 * The ground texture a splat layer draws in `season` (render.yaml `board.seasonGround`); interiors have no season and keep their own.
 * `surface` is the layer's own texture name.
 */
export function seasonGround(render: Pick<RenderDef, 'board'>, season: Season, surface: string, interior = false): string {
  return (!interior && render.board.seasonGround[season]?.[surface]) || surface;
}

/** The extra ground textures a board of `season` needs on top of the shared set (only those of the season shown are loaded). */
export function seasonTextures(render: Pick<RenderDef, 'board'>, season: Season, interior = false): string[] {
  return interior ? [] : [...new Set(Object.values(render.board.seasonGround[season] ?? {}))];
}

/** The model a prop draws in `season`: its seasonal version (render.yaml `board.seasonModels`), else itself. */
export function seasonModel(render: Pick<RenderDef, 'board'>, season: Season, model: string): string {
  return render.board.seasonModels[season]?.[model] ?? model;
}

/** Whether a prop gets painted snow (way B) in `season`: winter, and not a model that brings its own (render.yaml `board.snow.skip`). */
export function takesSnow(render: Pick<RenderDef, 'board'>, season: Season, model: string): boolean {
  return season === 'winter' && !render.board.snow.skip.some((p) => model.startsWith(p));
}
