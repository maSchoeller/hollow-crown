/**
 * Which props come in variants (render.yaml `board.variants`) and which list a terrain's prop draws from. Pure and shared by the
 * board (render) and `content:check` (content), hence in content; the rules never read it.
 */
import type { GameData } from '../core/gameData';
import type { Season } from '../core/defs';
import type { PropVariant } from '../core/renderDefs';

/** Classes of props that come in variants (render.yaml `board.variants`). */
export type VariantClass = 'house' | 'lodge' | 'rock' | 'tree' | 'field' | 'relief' | 'sarcophagus' | 'stall';

/** Class of the prop a terrain carries (terrain.yaml `prop`), or null for props without variants. */
export function variantClassOf(prop: string | undefined): VariantClass | null {
  switch (prop) {
    case 'tree':
    case 'house':
    case 'lodge':
    case 'field':
    case 'relief':
    case 'sarcophagus':
    case 'stall':
      return prop;
    case 'rock':
      return 'rock';
    default:
      return null;
  }
}

/**
 * The variants of a class. Trees follow the season of the board (`seasonOf`: autumn in act 2, snow in act 3); a season without an entry
 * (or none given) uses summer, the borderland of act 1. On the map a forest tile is a whole grove; the scenery around it stays with the
 * light single trees of `sceneryTree` (a grove has about four times the triangles, and the scenery has hundreds of forest tiles).
 */
export function variantList(data: Pick<GameData, 'render'>, cls: VariantClass, season?: Season, scenery = false): PropVariant[] {
  const v = data.render.board.variants;
  const trees = scenery ? v.sceneryTree : v.tree;
  const list = cls !== 'tree' ? v[cls] : (season !== undefined && trees[season]) || trees.summer || [];
  // the scenery around the map shows only the first `sceneryVariants` rolled models of a class: every model is a template of its own
  // (draw calls, story 7.8 AC 11); a hand-placed model (weight 0, story 15.8) never stands in the scenery
  return scenery ? list.filter((e) => e.weight > 0).slice(0, Math.max(1, data.render.board.sceneryVariants)) : list;
}
