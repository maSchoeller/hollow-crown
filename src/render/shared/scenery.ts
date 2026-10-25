/**
 * Landscape choices of the battle board: the tree set of a season, the weighted pick from it and the fences around fields.
 * Pure (no Babylon), so it is unit tested.
 */
import type { GameData } from '../../core/defs';

export interface TreeChoice {
  model: string;
  weight: number;
}

/**
 * Tree set of an act: the `render.board.trees` entry of the act (autumn in act 2, snow firs in act 3). Acts without an
 * entry (the summer borderland) get null: they use the manifest's plain trees.
 */
export function treeSetOfAct(data: Pick<GameData, 'render'>, act: number | undefined): TreeChoice[] | null {
  return (act !== undefined && data.render.board.trees[act]) || null;
}

/** Weighted pick from a tree set; roll in [0, 1). */
export function pickWeighted(mix: TreeChoice[], roll: number): TreeChoice {
  let t = roll * mix.reduce((a, m) => a + m.weight, 0);
  return mix.find((m) => (t -= m.weight) < 0) ?? mix[0]!;
}

/** One fence piece around a field, relative to the field's centre: x east, z north (= −tile y), rot about the up axis. */
export interface FencePiece {
  kind: 'straight' | 'broken' | 'corner';
  dx: number;
  dz: number;
  rot: number;
  /** length factor along the piece's own x axis (1 = the model's ~0.95 length) */
  stretch: number;
}

// Sides in the order N, S, W, E (the order of the fence rolls). `axis` = world direction of the edge; `ends` = the two
// field corners at its ends, each with its offset along the axis (in tiles from the side's middle).
const SIDES = [
  { dx: 0, dz: 0.5, rot: 0, axis: [1, 0], ends: [['NW', -0.5], ['NE', 0.5]] },
  { dx: 0, dz: -0.5, rot: 0, axis: [1, 0], ends: [['SW', -0.5], ['SE', 0.5]] },
  { dx: -0.5, dz: 0, rot: Math.PI / 2, axis: [0, 1], ends: [['SW', -0.5], ['NW', 0.5]] },
  { dx: 0.5, dz: 0, rot: Math.PI / 2, axis: [0, 1], ends: [['SE', -0.5], ['NE', 0.5]] },
] as const;

/**
 * Corner pieces: the model fence_corner has its arms along its local +x (east) and +z (north), i.e. rot 0 closes the
 * field's SW corner. A turn by rot in Babylon's left-handed frame sends +x to (cos, −sin) and north to (sin, cos), so
 * π/2 gives arms south+east (NW corner), π gives west+south (NE corner), 3π/2 gives north+west (SE corner).
 */
const CORNERS: Record<string, { dx: number; dz: number; rot: number }> = {
  SW: { dx: -0.5, dz: -0.5, rot: 0 },
  NW: { dx: -0.5, dz: 0.5, rot: Math.PI / 2 },
  NE: { dx: 0.5, dz: 0.5, rot: Math.PI },
  SE: { dx: 0.5, dz: -0.5, rot: (3 * Math.PI) / 2 },
};

const STRAIGHT = 0.95;
const ARM = 0.475;

/**
 * Fence around one field. `present` = which sides (N, S, W, E) have a fence, `broken` = which of them are damaged
 * (rolled by the caller). Where two present sides meet, a corner piece closes the corner (its arms reach 0.475 along
 * each side); the straight piece of a side then only fills what the arms leave over (a corner at one end shortens it
 * to the remaining half, corners at both ends drop it). Broken pieces replace full-length straights only.
 */
export function planFence(present: readonly boolean[], broken: readonly boolean[]): FencePiece[] {
  const has = (i: number) => present[i] === true;
  const out: FencePiece[] = [];
  const cornerAt = (name: string) => {
    const [a, b] = { NW: [0, 2], NE: [0, 3], SW: [1, 2], SE: [1, 3] }[name] as [number, number];
    return has(a) && has(b);
  };
  for (const name of ['SW', 'NW', 'NE', 'SE']) if (cornerAt(name)) out.push({ kind: 'corner', ...CORNERS[name]!, stretch: 1 });
  SIDES.forEach((s, i) => {
    if (!has(i)) return;
    let lo = -ARM;
    let hi = ARM;
    // a corner at an end: the arm covers up to 0.475 from the field corner, i.e. up to ±0.025 from the middle
    if (cornerAt(s.ends[0][0])) lo = -0.5 + ARM;
    if (cornerAt(s.ends[1][0])) hi = 0.5 - ARM;
    const len = hi - lo;
    if (len < 0.1) return;
    const mid = (lo + hi) / 2;
    const full = len >= STRAIGHT - 1e-9;
    out.push({
      kind: full && broken[i] ? 'broken' : 'straight',
      dx: s.dx + (s.axis[0] ?? 0) * mid,
      dz: s.dz + (s.axis[1] ?? 0) * mid,
      rot: s.rot,
      stretch: len / STRAIGHT,
    });
  });
  return out;
}
