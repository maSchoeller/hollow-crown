/**
 * Story 15.13: where a figure's feet are on a ramp, stairs or ladder. Pure, render only; the rules never read it.
 *
 * A connector rises from its own height at the low edge to the tile one level higher at the opposite edge, the way its
 * model is built (tools/art/props/interior.py). `render.yaml board.connectors` describes each model along that rise:
 * `from`/`to` = where the slope starts and ends as a share of the tile depth, `steps` = number of treads (0: a smooth
 * slope). Stairs carry a figure on the tread under it, so it climbs step by step instead of sinking into the treads.
 */

/** Shape of a connector model along its rise (render.yaml `board.connectors`). */
export interface ConnectorShape {
  /** share of the tile depth where the slope starts (0 = low edge) */
  from: number;
  /** share of the tile depth where it reaches the top (1 = high edge) */
  to: number;
  /** treads of a staircase; 0 = smooth (ramp, ladder) */
  steps: number;
}

/** Direction from a connector to the one neighbour higher than it, in map tiles (x east, y south); null without one. */
export function riseDir(heightAt: (gx: number, gy: number) => number, gx: number, gy: number): [number, number] | null {
  const h = heightAt(gx, gy);
  // the same order as `connectorRot`, which turns the model: north, east, west, south
  for (const [dx, dy] of [
    [0, -1],
    [1, 0],
    [-1, 0],
    [0, 1],
  ] as const)
    if (heightAt(gx + dx, gy + dy) > h) return [dx, dy];
  return null;
}

/**
 * Height of the surface of a connector at offset (ox, oy) from its tile centre (each -0.5 … 0.5): `base` at the low edge,
 * `top` (the higher tile's top, where the model ends) at the high edge.
 */
export function connectorSurface(shape: ConnectorShape, base: number, top: number, dir: readonly [number, number], ox: number, oy: number): number {
  // 0 at the low edge, 1 at the high edge
  const along = 0.5 + ox * dir[0] + oy * dir[1];
  const span = Math.max(1e-6, shape.to - shape.from);
  let share = Math.min(1, Math.max(0, (along - shape.from) / span));
  // the flat run before the first tread stays on the ground
  if (shape.steps > 0 && share > 0) share = Math.min(shape.steps, Math.floor(share * shape.steps) + 1) / shape.steps;
  return base + (top - base) * share;
}

/**
 * The surface of a connector as a polyline along its rise, from the low edge (0) to the high edge (1): the same heights as
 * `connectorSurface`, with each tread's riser as a vertical step (two points at the same place). The fog lies on it (story 2.6).
 */
export function connectorProfile(shape: ConnectorShape, base: number, top: number): Array<[number, number]> {
  const out: Array<[number, number]> = [
    [0, base],
    [shape.from, base],
  ];
  if (shape.steps > 0) {
    const span = shape.to - shape.from;
    for (let j = 0; j < shape.steps; j++) {
      const a = shape.from + (span * j) / shape.steps;
      out.push([a, base + ((top - base) * j) / shape.steps], [a, base + ((top - base) * (j + 1)) / shape.steps]);
    }
  } else out.push([shape.to, top]);
  out.push([1, top]);
  // drop points that repeat the one before (a slope from the low edge, a riser of height 0)
  return out.filter((p, i) => i === 0 || p[0] !== out[i - 1]![0] || p[1] !== out[i - 1]![1]);
}
