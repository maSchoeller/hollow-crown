/**
 * Film scenes (epic 16): a story scene played as a short 3D film on its battle map. The scene keeps its text, speakers and
 * moods; the film adds per line a camera shot, walks and gestures of its actors. Coordinates are tiles of the map:
 * actors stand on [x, y], camera points are [x, height, y] (height in tiles above the ground).
 */
import type { Pos, Team } from './defs';

/** A point on the board in tiles (fractions allowed): [x, y], y = south. */
export type FilmPoint = readonly [number, number];
/** A camera point: [x, height, y] in tiles. */
export type FilmEye = readonly [number, number, number];
export type FilmFacing = 'n' | 'e' | 's' | 'w';
/** Motions a figure can play (the baked clips of the board figures). */
export type FilmAnim = 'idle' | 'walk' | 'attack' | 'hit';

export interface FilmActorDef {
  /** a company member (unit id, `avatar` for the player's figure) or, with `model`, an extra of the map */
  id: string;
  /** model of an extra (`models/units/<model>.glb`); company members use their own figure */
  model?: string;
  team?: Team;
  at: FilmPoint;
  facing?: FilmFacing;
}

export interface FilmCameraDef {
  from: FilmEye;
  to: FilmEye;
  /** where the camera ends after `ms` (dolly, pan); missing parts stay */
  end?: { from?: FilmEye; to?: FilmEye };
  /** vertical field of view in degrees */
  fov: number;
  /** length of the camera move; the shot holds afterwards until the line is read */
  ms: number;
}

export interface FilmMoveDef {
  actor: string;
  path: FilmPoint[];
  ms: number;
}

export interface FilmGestureDef {
  actor: string;
  anim?: FilmAnim;
  /** turn towards this point */
  face?: FilmPoint;
}

export interface FilmShotDef {
  /** the scene line the shot starts with; it holds over the following lines until the next shot */
  line: string;
  camera: FilmCameraDef;
  moves?: FilmMoveDef[];
  gestures?: FilmGestureDef[];
}

export interface FilmDef {
  id: string;
  /** the story scene whose lines the film plays */
  scene: string;
  /** the battle map the film is staged on */
  map: string;
  /** cinema bars above and below the picture */
  letterbox?: boolean;
  actors: FilmActorDef[];
  shots: FilmShotDef[];
}

/** The film of a scene, if there is one. */
export function filmOfScene(films: Record<string, FilmDef> | undefined, sceneId: string): FilmDef | null {
  for (const f of Object.values(films ?? {})) if (f.scene === sceneId) return f;
  return null;
}

/**
 * The shot to show at each of the lines that play (after `resolveScene` filtered them): a line without a shot of its own keeps
 * the last one; lines before the first shot get the first. `fresh` is true where a shot starts (its moves and gestures run).
 */
export function filmCuts(film: FilmDef, lineIds: readonly string[]): { shot: FilmShotDef; fresh: boolean }[] {
  const own = new Map(film.shots.map((s) => [s.line, s]));
  const first = film.shots[0];
  if (!first) return [];
  let last: FilmShotDef | null = null;
  return lineIds.map((id) => {
    const s = own.get(id);
    if (s) {
      // a shot already opened by the lines before it (they had none) does not start again
      const fresh = s !== last;
      last = s;
      return { shot: s, fresh };
    }
    if (!last) {
      last = first;
      return { shot: first, fresh: true };
    }
    return { shot: last, fresh: false };
  });
}

/** Where an actor stands once every shot up to and including `upTo` (index into `film.shots`) has run its moves. */
export function actorSpot(film: FilmDef, actor: string, upTo: number): FilmPoint | null {
  const a = film.actors.find((x) => x.id === actor);
  if (!a) return null;
  let at: FilmPoint = a.at;
  for (const s of film.shots.slice(0, upTo + 1)) for (const m of s.moves ?? []) if (m.actor === actor && m.path.length) at = m.path[m.path.length - 1]!;
  return at;
}

/** Point along a path at `k` ∈ [0, 1], walked at even speed over its segments. */
export function alongPath(path: readonly FilmPoint[], k: number): FilmPoint {
  if (path.length === 0) return [0, 0];
  if (path.length === 1 || k <= 0) return path[0]!;
  const lens = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i]![0], p[1] - path[i]![1]));
  const total = lens.reduce((s, l) => s + l, 0);
  if (total === 0 || k >= 1) return path[path.length - 1]!;
  let rest = k * total;
  for (let i = 0; i < lens.length; i++) {
    const l = lens[i]!;
    if (rest <= l) {
      const a = path[i]!;
      const b = path[i + 1]!;
      const t = l === 0 ? 0 : rest / l;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    rest -= l;
  }
  return path[path.length - 1]!;
}

/** Camera eye and target of a shot at `k` ∈ [0, 1] of its move, eased in and out. */
export function cameraAt(c: FilmCameraDef, k: number): { from: FilmEye; to: FilmEye } {
  const t = Math.min(1, Math.max(0, k));
  const e = t * t * (3 - 2 * t);
  const mix = (a: FilmEye, b: FilmEye | undefined): FilmEye => (b ? [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e] : a);
  return { from: mix(c.from, c.end?.from), to: mix(c.to, c.end?.to) };
}

/** Compass facing from one point to another (the board's four facings). */
export function facingTowards(from: FilmPoint, to: FilmPoint): FilmFacing {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'e' : 'w';
  return dy > 0 ? 's' : 'n';
}

/** Whole tile of a film point (the board state needs integer positions). */
export const tileOf = (p: FilmPoint): Pos => [Math.round(p[0]), Math.round(p[1])];
