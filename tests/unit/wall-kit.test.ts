import { describe, expect, it } from 'vitest';
import { faceRot, gatePieces, wallPieces, type TerrainAt } from '../../src/render/board/wallKit';

/** A map from rows: # wall, G gate, D door, . ground. */
function grid(rows: string[]): TerrainAt {
  const ids: Record<string, string> = { '#': 'wall', G: 'gate', D: 'door', '.': 'plain' };
  return (x, y) => {
    const c = rows[y]?.[x];
    return c ? (ids[c] ?? null) : null;
  };
}

const models = (l: Array<{ model: string }>) => l.map((p) => p.model);

describe('wallPieces', () => {
  it('crowns corners of a thin wall with a tower', () => {
    const at = grid(['###', '#..', '#..']);
    expect(models(wallPieces(at, 0, 0))).toEqual(['tower_idle']);
  });

  it('gives a straight wall a parapet on each free side', () => {
    const at = grid(['...', '###', '...']);
    expect(models(wallPieces(at, 1, 1))).toEqual(['wallrim_idle', 'wallrim_idle']);
  });

  it('puts no towers on a block two fields thick', () => {
    const at = grid(['##', '##']);
    for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) expect(models(wallPieces(at, x, y))).not.toContain('tower_idle');
  });

  it('crowns a free end, but not beside a gate, which brings its own towers', () => {
    expect(models(wallPieces(grid(['###']), 0, 0))).toEqual(['tower_idle']);
    expect(models(wallPieces(grid(['#GG#']), 0, 0))).not.toContain('tower_idle');
  });
});

describe('gatePieces', () => {
  it('pairs two gate tiles into one gatehouse between them, the second tile draws nothing', () => {
    const at = grid(['#GG#']);
    expect(gatePieces(at, 1, 0)).toMatchObject([{ model: 'gatehouse_open', dx: 0.5, dy: 0 }]);
    expect(gatePieces(at, 2, 0)).toEqual([]);
  });

  it('pairs a vertical run along y', () => {
    const at = grid(['#', 'G', 'G', '#']);
    expect(gatePieces(at, 0, 1)).toMatchObject([{ model: 'gatehouse_open', dx: 0, dy: 0.5 }]);
    expect(gatePieces(at, 0, 2)).toEqual([]);
  });

  it('leaves the last tile of an odd run to the one-tile gate', () => {
    const at = grid(['#GGG#']);
    expect(models(gatePieces(at, 3, 0))).toEqual(['gate_idle']);
  });
});

describe('faceRot', () => {
  it('turns a door to the wall it stands in', () => {
    expect(faceRot(grid(['#D#']), 1, 0)).toBe(Math.PI);
    expect(faceRot(grid(['#', 'D', '#']), 0, 1)).toBe(Math.PI / 2);
  });
});
