/**
 * Which props come in variants (render.yaml `board.variants`) and which list a terrain's prop draws from. Pure and shared by the
 * board (render) and `content:check` (content), hence in content; the rules never read it.
 */
import type { GameData, PropVariant } from '../core/defs';

/** Classes of props that come in variants (render.yaml `board.variants`). */
export type VariantClass = 'house' | 'lodge' | 'rock' | 'tree';

/** Class of the prop a terrain carries (terrain.yaml `prop`), or null for props without variants. */
export function variantClassOf(prop: string | undefined): VariantClass | null {
  switch (prop) {
    case 'tree':
    case 'house':
    case 'lodge':
      return prop;
    case 'rock':
    case 'rockwall':
      return 'rock';
    default:
      return null;
  }
}

/**
 * The variants of a class. Trees follow the season of the act (autumn in act 2, snow firs in act 3); an act without an entry
 * (or none given) uses act 1, the summer borderland.
 */
export function variantList(data: Pick<GameData, 'render'>, cls: VariantClass, act?: number): PropVariant[] {
  const v = data.render.board.variants;
  if (cls !== 'tree') return v[cls];
  return (act !== undefined && v.tree[act]) || v.tree[1] || [];
}
