/**
 * The line a company holds in front of a ward (story 9.9 follow-up, simulator player for `defend`).
 * Generic, no map coordinates: the narrowest set of foot-passable tiles that cuts every foot route from the foes on the board to the
 * ward, not counting the ward's own neighbours. Found as a minimum vertex cut (unit-capacity max flow on the tile graph, the cut closest
 * to the ward). When that cut is wider than `ai.wardLineMax` (an open village) there is no line and the caller keeps crowding the ward.
 */
import type { Pos } from '../defs';
import type { GameData } from '../gameData';
import type { BattleState } from '../state';
import { inBounds, neighbors, posKey } from '../util';

export interface WardLine {
  /** the tiles to hold, sorted by x then y */
  cut: Pos[];
  /** keys of the tiles on the ward's side of the line (the cut excluded) */
  inside: Set<string>;
}

const INF = 1e9;

/** A tile a foot unit can stand on or pass; closed doors count as open because foes and the company open them. */
function footTile(data: GameData, s: BattleState, p: Pos): boolean {
  if (!inBounds(s, p)) return false;
  const terrain = s.terrain[p[1] * s.width + p[0]]!;
  return terrain === 'door' || data.terrain[terrain]?.cost.foot != null;
}

export function wardLine(data: GameData, s: BattleState, ward: Pos, foes: Pos[]): WardLine | null {
  const limit = data.balance.ai.wardLineMax;
  const n = s.width * s.height;
  const id = (p: Pos) => p[1] * s.width + p[0];
  const wardId = id(ward);
  const open: boolean[] = [];
  for (let y = 0; y < s.height; y++) for (let x = 0; x < s.width; x++) open.push(footTile(data, s, [x, y]));
  if (!open[wardId]) return null;
  const protect = new Set<number>([wardId]);
  for (const p of neighbors(ward)) if (inBounds(s, p)) protect.add(id(p));
  const foeIds = new Set(foes.filter((p) => inBounds(s, p)).map(id));
  if (!foeIds.size) return null;

  // split graph: tile t is in = 2t, out = 2t + 1; source = 2n, sink = in of the ward
  const S = 2 * n;
  const T = 2 * wardId;
  const to: number[] = [];
  const cap: number[] = [];
  const adj: number[][] = Array.from({ length: 2 * n + 1 }, () => []);
  const edge = (a: number, b: number, c: number) => {
    adj[a]!.push(to.length);
    to.push(b);
    cap.push(c);
    adj[b]!.push(to.length);
    to.push(a);
    cap.push(0);
  };
  for (let t = 0; t < n; t++) {
    if (!open[t]) continue;
    edge(2 * t, 2 * t + 1, protect.has(t) || foeIds.has(t) ? INF : 1);
    const p: Pos = [t % s.width, Math.floor(t / s.width)];
    for (const q of neighbors(p)) if (inBounds(s, q) && open[id(q)]) edge(2 * t + 1, 2 * id(q), INF);
  }
  for (const f of foeIds) if (open[f]) edge(S, 2 * f, INF);

  let flow = 0;
  while (flow <= limit) {
    const prev = new Array<number>(2 * n + 1).fill(-1);
    const seen = new Array<boolean>(2 * n + 1).fill(false);
    seen[S] = true;
    const queue = [S];
    for (let i = 0; i < queue.length && !seen[T]; i++) {
      for (const e of adj[queue[i]!]!) {
        const v = to[e]!;
        if (cap[e]! > 0 && !seen[v]) {
          seen[v] = true;
          prev[v] = e;
          queue.push(v);
        }
      }
    }
    if (!seen[T]) break;
    let bottleneck = INF;
    for (let v = T; v !== S; v = to[prev[v]! ^ 1]!) bottleneck = Math.min(bottleneck, cap[prev[v]!]!);
    if (bottleneck >= INF) return null; // a foe stands next to the ward: nothing to hold
    for (let v = T; v !== S; v = to[prev[v]! ^ 1]!) {
      cap[prev[v]!]! -= bottleneck;
      cap[prev[v]! ^ 1]! += bottleneck;
    }
    flow += bottleneck;
  }
  if (flow === 0 || flow > limit) return null;

  // the cut closest to the ward: nodes that still reach the sink in the residual graph lie on the ward's side
  const reach = new Array<boolean>(2 * n + 1).fill(false);
  reach[T] = true;
  const queue = [T];
  for (let i = 0; i < queue.length; i++) {
    for (const e of adj[queue[i]!]!) {
      // e leaves queue[i]; its twin e ^ 1 leads into it, with the residual capacity that decides
      const v = to[e]!;
      if (cap[e ^ 1]! > 0 && !reach[v]) {
        reach[v] = true;
        queue.push(v);
      }
    }
  }
  const cut: Pos[] = [];
  for (let t = 0; t < n; t++) if (open[t] && !reach[2 * t] && reach[2 * t + 1]) cut.push([t % s.width, Math.floor(t / s.width)]);
  if (!cut.length) return null;
  cut.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const blocked = new Set(cut.map(posKey));
  const inside = new Set<string>([posKey(ward)]);
  const todo: Pos[] = [ward];
  for (let i = 0; i < todo.length; i++) {
    for (const q of neighbors(todo[i]!)) {
      if (!inBounds(s, q) || !open[id(q)] || blocked.has(posKey(q)) || inside.has(posKey(q))) continue;
      inside.add(posKey(q));
      todo.push(q);
    }
  }
  return { cut, inside };
}
